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
 * Adding a checklist task in the guidance editor.
 *
 * A task is a line that starts "[ ] " (see local_edguidance\checklist). This writes one on a line of
 * its own - a new paragraph, or a new list item in a list - after the cursor's, or in the cursor's
 * line if that is empty, with its name selected so that typing replaces it.
 *
 * @module     tiny_edguidance/tasks
 * @copyright  2026 Andrew Rowatt <A.J.Rowatt@massey.ac.nz>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/** @var {string} What a task starts with. */
const BOX = '[ ] ';

/** @var {string} The lines a task can follow, and which one can be. */
const LINES = 'p,li,h1,h2,h3,h4,h5,h6,pre,div';

/**
 * Add a task after the cursor's line.
 *
 * @param {TinyMCE} editor
 * @param {string} name The name to select, for the teacher to type over.
 */
export const addTask = (editor, name) => {
    const dom = editor.dom;
    const body = editor.getBody();
    const line = dom.getParent(editor.selection.getStart(), LINES, body);

    editor.undoManager.transact(() => {
        let task;
        if (line && dom.isEmpty(line)) {
            task = line;
            task.replaceChildren();
        } else {
            task = dom.create(line?.nodeName === 'LI' ? 'li' : 'p');
            if (line) {
                dom.insertAfter(task, line);
            } else {
                body.appendChild(task);
            }
        }

        const text = editor.getDoc().createTextNode(BOX + name);
        task.appendChild(text);

        const range = dom.createRng();
        range.setStart(text, BOX.length);
        range.setEnd(text, BOX.length + name.length);
        editor.selection.setRng(range);
    });

    editor.focus();
    editor.nodeChanged();
};
