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
 * Common values for the teacher guidance editor button.
 *
 * @module     tiny_edguidance/common
 * @copyright  2026 Andrew Rowatt <A.J.Rowatt@massey.ac.nz>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

export default {
    pluginName: 'tiny_edguidance/plugin',
    component: 'tiny_edguidance',
    buttonName: 'tiny_edguidance',
    icon: 'tiny_edguidance',
    // The token, as local_edguidance\token writes it. Only the attribute matters for matching.
    tokenSelector: 'div[data-edguidance]',
    tokenClass: 'edguidance-embed',
};
