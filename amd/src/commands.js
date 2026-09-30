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
 * The teacher guidance button and menu.
 *
 * In the guidance editor it only adds checklist tasks. Elsewhere it adds and edits guidance, for
 * teachers who may; and for anyone, shows guidance they have marked as read. A teacher with nothing
 * on offer gets the button disabled, rather than an empty menu.
 *
 * @module     tiny_edguidance/commands
 * @copyright  2026 Andrew Rowatt <A.J.Rowatt@massey.ac.nz>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {getString} from 'core/str';
import {getButtonImage} from 'editor_tiny/utils';
import {buttonName, component, icon} from './common';
import {canManage, getPresets, isGuidanceEditor} from './options';
import {hasHiddenDismissed, showDismissed} from './previews';
import {addTask} from './tasks';
import {editGuidance, startBlank, startWithPreset, tokenAtCursor, usePreset} from './ui';

export const getSetup = async() => {
    const [
        buttonText,
        editText,
        useText,
        startText,
        blankText,
        showDismissedText,
        addTaskText,
        taskName,
        buttonImage,
    ] = await Promise.all([
        getString('buttontitle', component),
        getString('editguidance', component),
        getString('usepreset', component),
        getString('startpreset', component),
        getString('startblank', component),
        getString('showdismissed', component),
        getString('addtask', component),
        getString('taskname', component),
        getButtonImage('icon', component),
    ]);

    return (editor) => {
        /**
         * The menu. In the guidance editor, adding a task. Elsewhere, for a teacher who may write
         * guidance, edit the block under the cursor if there is one, then the three ways to add one;
         * then for anyone - while there is dismissed guidance in the text that is not showing - a way
         * to show it.
         *
         * Built each time it opens, because what is under the cursor changes.
         *
         * @returns {Array}
         */
        const menuItems = () => {
            if (isGuidanceEditor(editor)) {
                return [{type: 'menuitem', text: addTaskText, onAction: () => addTask(editor, taskName)}];
            }

            const items = [];
            if (canManage(editor)) {
                items.push(...manageItems());
            }

            // Once shown it stays shown, so there is nothing to offer after that.
            if (hasHiddenDismissed(editor)) {
                if (items.length) {
                    items.push({type: 'separator'});
                }
                items.push({type: 'menuitem', text: showDismissedText, onAction: () => showDismissed(editor)});
            }

            return items;
        };

        /**
         * Editing the block under the cursor, and the ways to add one.
         *
         * @returns {Array}
         */
        const manageItems = () => {
            const items = [];
            const presets = getPresets(editor);

            const token = tokenAtCursor(editor);
            if (token) {
                items.push({type: 'menuitem', text: editText, onAction: () => editGuidance(editor, token)});
                items.push({type: 'separator'});
            }

            if (presets.length) {
                items.push({
                    type: 'nestedmenuitem',
                    text: useText,
                    getSubmenuItems: () => presets.map((preset) => ({
                        type: 'menuitem',
                        text: preset.title,
                        onAction: () => usePreset(editor, preset.slot),
                    })),
                });
                items.push({
                    type: 'nestedmenuitem',
                    text: startText,
                    getSubmenuItems: () => presets.map((preset) => ({
                        type: 'menuitem',
                        text: preset.title,
                        onAction: () => startWithPreset(editor, preset.slot),
                    })),
                });
            }

            items.push({type: 'menuitem', text: blankText, onAction: () => startBlank(editor)});

            return items;
        };

        /**
         * Keep the button enabled only while its menu would have something in it.
         *
         * Re-checked on every node change, which the previews also fire when they arrive, since that
         * is when dismissed guidance comes to light.
         *
         * @param {object} api The button's, or the menu item's.
         * @returns {Function} What undoes it.
         */
        const onSetup = (api) => {
            const update = () => api.setEnabled(menuItems().length > 0);
            editor.on('NodeChange', update);
            update();
            return () => editor.off('NodeChange', update);
        };

        editor.ui.registry.addIcon(icon, buttonImage.html);

        editor.ui.registry.addMenuButton(buttonName, {
            icon,
            tooltip: buttonText,
            fetch: (callback) => callback(menuItems()),
            onSetup,
        });

        editor.ui.registry.addNestedMenuItem(buttonName, {
            icon,
            text: buttonText,
            getSubmenuItems: () => menuItems(),
            onSetup,
        });
    };
};
