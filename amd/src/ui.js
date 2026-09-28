// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Adding and editing teacher guidance from the editor.
 *
 * "Use a preset" needs nothing typed, so it goes straight to local_edguidance_embed_preset. Everything
 * else - "Start with a preset", "Start with blank", and editing a block already in the text - opens
 * local_edguidance's own form in a modal. Either way the server hands back a key, and all this module
 * ever puts in the text is the token for that key.
 *
 * @module     tiny_edguidance/ui
 * @copyright  2026 Andrew Rowatt <A.J.Rowatt@massey.ac.nz>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import ModalForm from 'core_form/modalform';
import Notification from 'core/notification';
import Pending from 'core/pending';
import {call as fetchMany} from 'core/ajax';
import {getString} from 'core/str';
import {getContextId} from 'editor_tiny/options';
import {component, keyPattern, tokenClass, tokenSelector} from './common';
import {getSectionId} from './options';
import {refresh} from './previews';

/**
 * The token under the cursor, if there is one.
 *
 * @param {TinyMCE} editor
 * @returns {HTMLElement|null}
 */
export const tokenAtCursor = (editor) => {
    const node = editor.selection.getNode();
    return node && node.closest ? node.closest(tokenSelector) : null;
};

/**
 * Put a token into the text, or re-key the one being edited.
 *
 * @param {TinyMCE} editor
 * @param {string} key The block's key.
 * @param {HTMLElement|null} existing The token being edited, if any.
 */
const placeToken = (editor, key, existing = null) => {
    if (!keyPattern.test(key)) {
        throw new Error('Unexpected teacher guidance key');
    }

    if (existing) {
        // The server may have handed back a different key - a token pasted in from another
        // activity or section gets a block of its own - so the token follows whatever came back.
        editor.dom.setAttrib(existing, 'data-edguidance', key);
        editor.undoManager.add();
        editor.nodeChanged();
        // The guidance has just changed, whether or not its key has.
        refresh(editor, key);
        return;
    }

    editor.insertContent(`<div class="${tokenClass}" data-edguidance="${key}"></div>`);
};

/**
 * Open the guidance form in a modal.
 *
 * @param {TinyMCE} editor
 * @param {object} args Extra form arguments: key, or startslot.
 * @param {HTMLElement|null} existing The token being edited, if any.
 */
const openForm = async(editor, args, existing = null) => {
    const modalForm = new ModalForm({
        formClass: 'local_edguidance\\form\\embed_form',
        args: {contextid: getContextId(editor), sectionid: getSectionId(editor), ...args},
        modalConfig: {
            title: await getString('modaltitle', component),
            large: true,
        },
    });

    modalForm.addEventListener(modalForm.events.FORM_SUBMITTED, (event) => {
        try {
            placeToken(editor, event.detail.key, existing);
        } catch (error) {
            Notification.exception(error);
        }
    });

    modalForm.show();
};

/**
 * "Use a preset": link a new block to a site preset and insert it. No form - there is nothing to type.
 *
 * @param {TinyMCE} editor
 * @param {number} slot The preset slot.
 */
export const usePreset = async(editor, slot) => {
    const pending = new Pending('tiny_edguidance/ui:usepreset');

    try {
        const result = await fetchMany([{
            methodname: 'local_edguidance_embed_preset',
            args: {contextid: getContextId(editor), sectionid: getSectionId(editor), presetslot: slot},
        }])[0];
        placeToken(editor, result.key);
    } catch (error) {
        Notification.exception(error);
    }

    pending.resolve();
};

/**
 * "Start with a preset": a new block whose editor starts with a copy of the preset.
 *
 * @param {TinyMCE} editor
 * @param {number} slot The preset slot.
 */
export const startWithPreset = (editor, slot) => openForm(editor, {startslot: slot});

/**
 * "Start with blank".
 *
 * @param {TinyMCE} editor
 */
export const startBlank = (editor) => openForm(editor, {});

/**
 * Edit a block already in the text.
 *
 * @param {TinyMCE} editor
 * @param {HTMLElement} token The token.
 */
export const editGuidance = (editor, token) => openForm(editor, {key: token.dataset.edguidance || ''}, token);
