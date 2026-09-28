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
 * Each guidance token previewed in the editor as the page will show it.
 *
 * The preview must never be saved. Guidance in the host text would reach students through search,
 * web services and a switched-off filter; and the filter matches a token only up to its first
 * </div>, so it would strip the start of a filled token and leave the rest of the guidance showing.
 * So the preview is never put inside the token. It goes in a shadow root attached to the token,
 * which innerHTML and cloneNode leave out - and so does everything TinyMCE builds from them: the
 * saved text, autosave, copying and undo.
 *
 * The server renders each block (local_edguidance_get_previews) with the page's own template. The
 * editor's iframe carries only the theme's editor stylesheet, so each shadow root links the page's
 * theme stylesheets as well, which the page around the editor has already loaded.
 *
 * TinyMCE rebuilds tokens freely - setting content, undo, paste, drag and drop - and a rebuilt token
 * has no shadow root. Not every path fires an event (undo can rewrite the body directly), so a
 * MutationObserver finds tokens as they arrive.
 *
 * The shadow root also holds the buttons that move the token up and down (see move), for the same
 * reason: nothing in it is ever saved.
 *
 * @module     tiny_edguidance/previews
 * @copyright  2026 Andrew Rowatt <A.J.Rowatt@massey.ac.nz>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import Notification from 'core/notification';
import Pending from 'core/pending';
import {call as fetchMany} from 'core/ajax';
import {getContextId} from 'editor_tiny/options';
import {keyPattern, tokenSelector} from './common';
import {addMoveControls, moveStyle} from './move';
import {getPageCss, getSectionId} from './options';

/** @var {string} The class of the element in each shadow root that holds the preview. */
const CONTENTCLASS = 'tiny-edguidance-preview';

/** @var {WeakMap<object, object>} Each editor's previews, and what it has asked for. */
const states = new WeakMap();

/** @var {WeakMap<HTMLElement, string|null>} What each token is showing: preview HTML, or null for the chip. */
const shown = new WeakMap();

/**
 * The stylesheet inside each shadow root, after the page's own.
 *
 * @param {string} hint What the header says in place of the page's Dismiss button.
 * @returns {string}
 */
const previewStyle = (hint) => `
    :host {
        display: block;
        position: relative;
    }
    /* Clicks land on the token itself, which opens the block's form. Nothing in the guidance - a
       link, a video - acts on its own inside the editor. */
    .${CONTENTCLASS} {
        pointer-events: none;
    }
    .edguidance-header::after {
        content: ${JSON.stringify(hint)};
        margin-left: auto;
        font-size: 0.8rem;
        font-weight: 500;
        color: #0f7b8f;
    }
    /* Until the preview arrives, or if it cannot. */
    .tiny-edguidance-chip {
        margin: 0.5rem 0;
        padding: 0.35rem 0.6rem;
        border-left: 3px solid #2f8a9b;
        background-color: #2f8a9b14;
        color: #12545f;
        font-size: 0.85rem;
        font-weight: 600;
        line-height: 1.4;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }
    ${moveStyle}
`;

/**
 * The page's Font Awesome @font-face rules, for the editor's own document.
 *
 * The guidance title's icon is Font Awesome, declared by the page's theme stylesheet. The shadow
 * roots link that stylesheet, but a browser ignores @font-face inside a shadow root, so the fonts
 * must also be declared on the document the shadow roots are in.
 *
 * @returns {string}
 */
const fontFaces = () => Array.from(document.styleSheets)
    .flatMap((sheet) => {
        try {
            return Array.from(sheet.cssRules);
        } catch (error) {
            // Another origin's stylesheet, which cannot be read. The theme's never is.
            return [];
        }
    })
    .filter((rule) => rule instanceof CSSFontFaceRule && /font ?awesome/i.test(rule.style.getPropertyValue('font-family')))
    .map((rule) => rule.cssText)
    .join('\n');

/**
 * Give a token its shadow root, with the page's stylesheets, an empty preview and the move buttons.
 *
 * @param {TinyMCE} editor
 * @param {HTMLElement} token
 * @returns {ShadowRoot}
 */
const attach = (editor, token) => {
    const doc = token.ownerDocument;
    const root = token.attachShadow({mode: 'open'});

    getPageCss(editor).forEach((href) => {
        const link = doc.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        root.append(link);
    });

    const {labels} = states.get(editor);

    const style = doc.createElement('style');
    style.textContent = previewStyle(labels.hint);

    const content = doc.createElement('div');
    content.className = CONTENTCLASS;

    root.append(style, content);
    addMoveControls(editor, root, labels);

    return root;
};

/**
 * Show a token's preview, or the chip until there is one.
 *
 * @param {TinyMCE} editor
 * @param {HTMLElement} token
 */
const show = (editor, token) => {
    const state = states.get(editor);

    // TinyMCE's own scaffolding - the offscreen copy it makes of a selected token, say - is not text.
    if (!token.matches(tokenSelector) || token.closest('[data-mce-bogus]')) {
        return;
    }

    const key = token.dataset.edguidance || '';
    const html = keyPattern.test(key) ? state.html.get(key) : undefined;
    if (html === undefined && keyPattern.test(key)) {
        want(editor, key);
    }

    const next = html ?? null;
    if (token.shadowRoot && shown.get(token) === next) {
        return;
    }

    const content = (token.shadowRoot || attach(editor, token)).querySelector(`.${CONTENTCLASS}`);
    if (next === null) {
        const chip = token.ownerDocument.createElement('div');
        chip.className = 'tiny-edguidance-chip';
        chip.textContent = `\u{1F4A1} ${state.labels.chip}`;
        content.replaceChildren(chip);
    } else {
        content.innerHTML = next;
    }
    shown.set(token, next);
};

/**
 * Show every token in the editor.
 *
 * @param {TinyMCE} editor
 */
const showAll = (editor) => {
    editor.getBody().querySelectorAll(tokenSelector).forEach((token) => show(editor, token));
};

/**
 * Ask the server for the previews wanted so far.
 *
 * @param {TinyMCE} editor
 */
const send = async(editor) => {
    const state = states.get(editor);
    const keys = [...state.wanted];
    const pending = state.pending;
    state.wanted.clear();
    state.pending = null;

    if (editor.removed) {
        pending.resolve();
        return;
    }

    // A key asked for again - its guidance edited - while an earlier answer is on its way must not
    // have that earlier answer overwrite the later one.
    const batch = ++state.batch;
    keys.forEach((key) => state.asked.set(key, batch));

    try {
        const previews = await fetchMany([{
            methodname: 'local_edguidance_get_previews',
            args: {contextid: getContextId(editor), sectionid: getSectionId(editor), keys},
        }])[0];

        previews.forEach(({key, html}) => {
            if (state.asked.get(key) === batch) {
                state.html.set(key, html);
            }
        });
        if (!editor.removed) {
            showAll(editor);
        }
    } catch (error) {
        // Left as the chip, which still opens the form. Not asked again until the guidance is edited.
        Notification.exception(error);
    }

    pending.resolve();
};

/**
 * Ask for a key's preview.
 *
 * Tokens arrive together - a whole text at once - so their keys are gathered and sent together.
 *
 * @param {TinyMCE} editor
 * @param {string} key
 * @param {boolean} again Ask even if it has been asked before, because the guidance has changed.
 */
const want = (editor, key, again = false) => {
    const state = states.get(editor);
    if (!again && (state.html.has(key) || state.asked.has(key))) {
        return;
    }

    state.wanted.add(key);
    if (!state.pending) {
        state.pending = new Pending('tiny_edguidance/previews:send');
        setTimeout(() => send(editor), 0);
    }
};

/**
 * Fetch a key's preview again, because its guidance has just changed.
 *
 * The tokens keep showing the old preview until the new one arrives.
 *
 * @param {TinyMCE} editor
 * @param {string} key
 */
export const refresh = (editor, key) => {
    if (states.has(editor) && keyPattern.test(key)) {
        want(editor, key, true);
    }
};

/**
 * Preview every token in the editor, now and whenever one arrives.
 *
 * Call once the editor's body exists.
 *
 * @param {TinyMCE} editor
 * @param {object} labels
 * @param {string} labels.chip What a token shows until its preview arrives.
 * @param {string} labels.hint What the preview's header says, where the page has a Dismiss button.
 * @param {string} labels.up The move up button's label.
 * @param {string} labels.down The move down button's label.
 */
export const watch = (editor, labels) => {
    states.set(editor, {
        labels,
        // Key => preview HTML.
        html: new Map(),
        // Key => the batch that last asked for it.
        asked: new Map(),
        batch: 0,
        // Keys for the next batch, and the Pending that covers them until the answer is shown.
        wanted: new Set(),
        pending: null,
    });

    const fonts = fontFaces();
    if (fonts) {
        editor.dom.addStyle(fonts);
    }

    const observer = new MutationObserver((records) => records.forEach((record) => {
        if (record.type === 'attributes') {
            show(editor, record.target);
            return;
        }
        record.addedNodes.forEach((node) => {
            if (node.nodeType !== Node.ELEMENT_NODE) {
                return;
            }
            if (node.matches(tokenSelector)) {
                show(editor, node);
            }
            node.querySelectorAll(tokenSelector).forEach((token) => show(editor, token));
        });
    }));
    observer.observe(editor.getBody(), {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-edguidance'],
    });
    editor.on('remove', () => observer.disconnect());

    showAll(editor);
};
