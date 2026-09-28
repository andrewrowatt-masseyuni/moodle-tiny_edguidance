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
 * Options for the teacher guidance editor button.
 *
 * @module     tiny_edguidance/options
 * @copyright  2026 Andrew Rowatt <A.J.Rowatt@massey.ac.nz>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {getPluginOptionName} from 'editor_tiny/options';
import {pluginName} from './common';

const presetsName = getPluginOptionName(pluginName, 'presets');
const sectionIdName = getPluginOptionName(pluginName, 'sectionid');

/**
 * Register the options.
 *
 * @param {TinyMCE} editor
 */
export const register = (editor) => {
    editor.options.register(presetsName, {
        processor: 'array',
        "default": [],
    });
    editor.options.register(sectionIdName, {
        processor: 'number',
        "default": 0,
    });
};

/**
 * The site presets on offer, as [{slot, title}].
 *
 * @param {TinyMCE} editor
 * @returns {Array}
 */
export const getPresets = (editor) => editor.options.get(presetsName);

/**
 * The section whose summary is being edited, or 0 for any other editor.
 *
 * @param {TinyMCE} editor
 * @returns {number}
 */
export const getSectionId = (editor) => editor.options.get(sectionIdName);
