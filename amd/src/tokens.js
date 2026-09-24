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
 * How a guidance token looks and behaves inside the editor.
 *
 * The token saved into the text is an empty <div data-edguidance="KEY">: it carries no guidance, so
 * an empty div is all an editor would show. In here it is drawn as a labelled, non-editable chip
 * instead - the label comes from a stylesheet ::before, and contenteditable is added on the way in
 * and removed on the way out - so nothing extra is ever saved.
 *
 * @module     tiny_edguidance/tokens
 * @copyright  2026 Andrew Rowatt <A.J.Rowatt@massey.ac.nz>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {getString} from 'core/str';
import {registerPlaceholderSelectors} from 'editor_tiny/options';
import {component, tokenSelector} from './common';
import {editGuidance} from './ui';

/**
 * The chip's stylesheet, for the editor's own document.
 *
 * @param {string} label The chip's text.
 * @returns {string}
 */
const chipStyle = (label) => `
    ${tokenSelector} {
        display: block;
        margin: 0.5rem 0;
        padding: 0.35rem 0.6rem;
        border-left: 3px solid #2f8a9b;
        background-color: #2f8a9b14;
        color: #12545f;
        font-size: 0.85rem;
        font-weight: 600;
        cursor: pointer;
        user-select: none;
        overflow: hidden;
        white-space: nowrap;
        line-height: 1.4;
        height: 1.4em;
        box-sizing: content-box;
    }
    ${tokenSelector}::before {
        content: ${JSON.stringify('\u{1F4A1} ' + label)};
    }
    ${tokenSelector}[data-mce-selected] {
        outline: 2px solid #0f6cbf;
    }
`;

export const getSetup = async() => {
    const label = await getString('chiplabel', component);

    return (editor) => {
        // Tells Moodle's accessibility checker this is a placeholder, not content to be judged.
        registerPlaceholderSelectors(editor, [tokenSelector]);

        editor.on('init', () => {
            editor.dom.addStyle(chipStyle(label));
        });

        // Whenever content arrives - initial load, paste, undo - make every token non-editable, so
        // its (padding) content cannot be typed into and it moves as one unit.
        editor.on('SetContent', () => {
            editor.getBody().querySelectorAll(`${tokenSelector}:not([contenteditable])`).forEach((node) => {
                node.contentEditable = false;
            });
        });

        // ...and take that back off on the way out, so the saved token stays exactly the token.
        editor.on('PreProcess', (event) => {
            event.node.querySelectorAll(tokenSelector).forEach((node) => node.removeAttribute('contenteditable'));
        });

        editor.on('click', (event) => {
            const token = event.target.closest ? event.target.closest(tokenSelector) : null;
            if (token) {
                event.preventDefault();
                editor.selection.select(token);
                editGuidance(editor, token);
            }
        });
    };
};
