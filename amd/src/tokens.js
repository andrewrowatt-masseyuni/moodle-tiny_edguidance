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
 * an empty div is all an editor would show. In here it shows the guidance as the page will (see
 * previews), as one non-editable unit that opens the guidance form when clicked - for a teacher who
 * may edit guidance; for anyone else a click does nothing but what the preview's own controls do.
 * contenteditable is added on the way in and taken off on the way out, and the preview is never
 * inside the token, so nothing extra is ever saved. All of that is for everyone: a teacher who may
 * not edit guidance still edits the text around it, and must not break it.
 *
 * @module     tiny_edguidance/tokens
 * @copyright  2026 Andrew Rowatt <A.J.Rowatt@massey.ac.nz>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {getStrings} from 'core/str';
import {registerPlaceholderSelectors} from 'editor_tiny/options';
import {component, tokenSelector} from './common';
import {canManage} from './options';
import {watch} from './previews';
import {editGuidance} from './ui';

/**
 * The token's stylesheet, for the editor's own document. What it shows is styled in its shadow root.
 *
 * @returns {string}
 */
const tokenStyle = () => `
    ${tokenSelector} {
        display: block;
        cursor: pointer;
        user-select: none;
    }
    ${tokenSelector}[data-mce-selected] {
        outline: 2px solid #0f6cbf;
    }
`;

export const getSetup = async() => {
    const [chip, plainChip, hint, dismissedHint, completedHint, readHint, completeHint, up, down] = await getStrings([
        {key: 'chiplabel', component},
        {key: 'buttontitle', component},
        {key: 'clicktoedit', component},
        {key: 'clicktoeditdismissed', component},
        {key: 'clicktoeditcompleted', component},
        {key: 'markedread', component},
        {key: 'markedcomplete', component},
        {key: 'moveup', component},
        {key: 'movedown', component},
    ]);

    return (editor) => {
        // Tells Moodle's accessibility checker this is a placeholder, not content to be judged.
        registerPlaceholderSelectors(editor, [tokenSelector]);

        // However the text is read - saved, autosaved, copied, with or without events - a token comes
        // out as exactly the token: no contenteditable, and nothing inside it. The preview never is
        // inside it, but the source code view or a paste could put anything there, and the filter
        // strips a token only up to its first </div>.
        editor.on('PreInit', () => {
            editor.serializer.addAttributeFilter('data-edguidance', (nodes) => nodes.forEach((node) => {
                node.attr('contenteditable', null);
                node.empty();
            }));
        });

        editor.on('init', () => {
            editor.dom.addStyle(tokenStyle());
            // What the header says: how to edit it, to those who may.
            const labels = canManage(editor)
                ? {chip, hint, dismissedHint, completedHint, up, down}
                : {chip: plainChip, hint: '', dismissedHint: readHint, completedHint: completeHint, up, down};
            watch(editor, labels);
        });

        // Whenever content arrives - initial load, paste, undo - make every token non-editable, so
        // it cannot be typed into and it moves as one unit.
        editor.on('SetContent', () => {
            editor.getBody().querySelectorAll(`${tokenSelector}:not([contenteditable])`).forEach((node) => {
                node.contentEditable = false;
            });
        });

        editor.on('click', (event) => {
            const token = event.target.closest ? event.target.closest(tokenSelector) : null;
            if (token && canManage(editor)) {
                event.preventDefault();
                editor.selection.select(token);
                editGuidance(editor, token);
            }
        });
    };
};
