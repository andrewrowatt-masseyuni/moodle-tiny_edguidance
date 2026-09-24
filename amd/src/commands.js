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
 * @module     tiny_edguidance/commands
 * @copyright  2026 Andrew Rowatt <A.J.Rowatt@massey.ac.nz>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {getString} from 'core/str';
import {getButtonImage} from 'editor_tiny/utils';
import {buttonName, component, icon} from './common';
import {getPresets} from './options';
import {editGuidance, startBlank, startWithPreset, tokenAtCursor, usePreset} from './ui';

export const getSetup = async() => {
    const [
        buttonText,
        editText,
        useText,
        startText,
        blankText,
        buttonImage,
    ] = await Promise.all([
        getString('buttontitle', component),
        getString('editguidance', component),
        getString('usepreset', component),
        getString('startpreset', component),
        getString('startblank', component),
        getButtonImage('icon', component),
    ]);

    return (editor) => {
        /**
         * The menu: edit the block under the cursor if there is one, then the three ways to add one.
         *
         * Built each time it opens, because what is under the cursor changes.
         *
         * @returns {Array}
         */
        const menuItems = () => {
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

        editor.ui.registry.addIcon(icon, buttonImage.html);

        editor.ui.registry.addMenuButton(buttonName, {
            icon,
            tooltip: buttonText,
            fetch: (callback) => callback(menuItems()),
        });

        editor.ui.registry.addNestedMenuItem(buttonName, {
            icon,
            text: buttonText,
            getSubmenuItems: () => menuItems(),
        });
    };
};
