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
 * Up and down buttons that move a guidance token past the element before or after it.
 *
 * The buttons live in the token's shadow root beside its preview (see previews), so like the preview
 * they are never part of the text: nothing has to strip them on the way out, and adding them is not
 * a change TinyMCE could record. They appear while the token is hovered, at its bottom right, clear
 * of the "Click to edit" in the preview's header.
 *
 * A move swaps the token with its neighbour among its parent's children - one paragraph, heading or
 * other block at a time - in a single undo step.
 *
 * @module     tiny_edguidance/move
 * @copyright  2026 Andrew Rowatt <A.J.Rowatt@massey.ac.nz>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/** @var {string} The class of the element in each shadow root that holds the buttons. */
const CONTROLSCLASS = 'tiny-edguidance-move';

/** @var {object} Each direction's arrow. */
const ARROWS = {
    up: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">' +
        '<path fill="currentColor" d="M8 3.5 2.5 9l1.06 1.06L8 5.62l4.44 4.44L13.5 9z"/></svg>',
    down: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">' +
        '<path fill="currentColor" d="M8 12.5 13.5 7l-1.06-1.06L8 10.38 3.56 5.94 2.5 7z"/></svg>',
};

/**
 * The buttons' stylesheet, for the shadow root. The token itself must be positioned (see previews).
 */
export const moveStyle = `
    .${CONTROLSCLASS} {
        position: absolute;
        right: 4px;
        bottom: 4px;
        display: flex;
        gap: 2px;
        opacity: 0;
        transition: opacity 0.12s;
        pointer-events: none;
        z-index: 5;
    }
    :host(:hover) .${CONTROLSCLASS} {
        opacity: 1;
        pointer-events: auto;
    }
    .${CONTROLSCLASS} button {
        width: 24px;
        height: 24px;
        padding: 0;
        border: 1px solid rgba(0, 0, 0, 0.15);
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.95);
        color: #333;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
    }
    .${CONTROLSCLASS} button:hover:not([disabled]) {
        background: #fff;
        border-color: rgba(0, 0, 0, 0.3);
    }
    .${CONTROLSCLASS} button[disabled] {
        opacity: 0.35;
        cursor: default;
    }
`;

/**
 * The element a token would move past, if there is one.
 *
 * TinyMCE's own scaffolding - the fake caret it puts beside a selected token, the offscreen copy it
 * makes of it - is not text, and is stepped over.
 *
 * @param {HTMLElement} token
 * @param {string} direction up or down.
 * @returns {HTMLElement|null}
 */
const neighbour = (token, direction) => {
    const step = (node) => (direction === 'up' ? node.previousElementSibling : node.nextElementSibling);

    let node = step(token);
    while (node && node.hasAttribute('data-mce-bogus')) {
        node = step(node);
    }

    return node;
};

/**
 * Move a token past its neighbour, and leave it selected so that it can be moved again.
 *
 * @param {TinyMCE} editor
 * @param {HTMLElement} token
 * @param {string} direction up or down.
 */
const move = (editor, token, direction) => {
    const target = neighbour(token, direction);
    if (!target || editor.mode.isReadOnly()) {
        return;
    }

    editor.undoManager.transact(() => {
        if (direction === 'up') {
            target.before(token);
        } else {
            target.after(token);
        }
    });
    editor.selection.select(token);
    editor.selection.scrollIntoView(token);
    editor.nodeChanged();
};

/**
 * Add the buttons to a token's shadow root.
 *
 * @param {TinyMCE} editor
 * @param {ShadowRoot} root
 * @param {object} labels
 * @param {string} labels.up
 * @param {string} labels.down
 */
export const addMoveControls = (editor, root, labels) => {
    const token = root.host;
    const doc = token.ownerDocument;

    const controls = doc.createElement('div');
    controls.className = CONTROLSCLASS;

    const buttons = ['up', 'down'].map((direction) => {
        const button = doc.createElement('button');
        button.type = 'button';
        // Out of the editor's tab order, as the rest of the token is.
        button.tabIndex = -1;
        button.dataset.direction = direction;
        button.title = labels[direction];
        button.setAttribute('aria-label', labels[direction]);
        button.innerHTML = ARROWS[direction];
        return button;
    });
    controls.append(...buttons);

    const update = () => buttons.forEach((button) => {
        button.disabled = !neighbour(token, button.dataset.direction);
    });

    // Stopped here, inside the shadow root, so the click never reaches the token's own click
    // handler, which would open the guidance form.
    controls.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();

        const button = event.target.closest('button');
        if (button && !button.disabled) {
            move(editor, token, button.dataset.direction);
            update();
        }
    });
    token.addEventListener('mouseenter', update);

    root.append(controls);
};
