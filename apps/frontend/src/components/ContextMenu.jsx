import React, { useEffect, useRef } from 'react';
import {
    Copy,
    Scissors,
    Trash2,
    PlusCircle,
    CopyPlus,
    Undo2,
    Redo2,
    MousePointer2
} from 'lucide-react';
import './styles/ContextMenu.css';

/**
 * ContextMenu Component
 * 
 * @param {Object} props
 * @param {number} props.x - X position
 * @param {number} props.y - Y position
 * @param {string} props.type - Type of context ('canvas', 'node', 'edge')
 * @param {Object} props.data - Data of the element (node or edge)
 * @param {Function} props.onClose - Function to close the menu
 * @param {Object} props.actions - Map of action handlers
 */
const ContextMenu = ({ x, y, type, data, onClose, actions }) => {
    const menuRef = useRef(null);

    // Auto-focus and boundary detection
    useEffect(() => {
        if (menuRef.current) {
            const menu = menuRef.current;
            const rect = menu.getBoundingClientRect();
            const winWidth = window.innerWidth;
            const winHeight = window.innerHeight;

            // Bound check
            if (x + rect.width > winWidth) {
                menu.style.left = `${x - rect.width}px`;
            } else {
                menu.style.left = `${x}px`;
            }

            if (y + rect.height > winHeight) {
                menu.style.top = `${y - rect.height}px`;
            } else {
                menu.style.top = `${y}px`;
            }

            // Accessibility: Focus the first button
            const firstButton = menu.querySelector('button');
            if (firstButton) firstButton.focus();
        }
    }, [x, y]);

    // Click outside and Esc close
    useEffect(() => {
        const handleClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };

        document.addEventListener('mousedown', handleClick);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handleClick);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    const renderItem = ({ icon: Icon, label, shortcut, onClick, danger = false, disabled = false }) => (
        <button
            className={`menu-item ${danger ? 'danger' : ''} ${disabled ? 'disabled' : ''}`}
            onClick={(e) => {
                e.stopPropagation();
                if (!disabled) {
                    onClick();
                    onClose();
                }
            }}
            disabled={disabled}
            role="menuitem"
        >
            <div className="item-icon">
                <Icon size={14} />
            </div>
            <span className="item-label">{label}</span>
            {shortcut && <span className="item-shortcut">{shortcut}</span>}
        </button>
    );

    const renderDivider = () => <div className="menu-divider" role="separator" />;

    return (
        <div
            ref={menuRef}
            className="context-menu"
            style={{ left: x, top: y }}
            role="menu"
            aria-label="Context Menu"
        >
            {type === 'node' && (
                <>
                    <div className="menu-header">{data?.data?.label || 'Nodo'}</div>
                    {renderItem({ icon: Copy, label: 'Copiar', shortcut: 'Ctrl+C', onClick: actions.copy })}
                    {renderItem({ icon: Scissors, label: 'Cortar', shortcut: 'Ctrl+X', onClick: actions.cut })}
                    {renderItem({ icon: CopyPlus, label: 'Duplicar', shortcut: 'Ctrl+D', onClick: actions.duplicate })}
                    {renderDivider()}
                    {renderItem({ icon: Trash2, label: 'Eliminar', shortcut: 'Del', onClick: actions.delete, danger: true })}
                </>
            )}

            {type === 'selection' && (
                <>
                    <div className="menu-header">Selección ({data?.nodes?.length || 0})</div>
                    {renderItem({ icon: Copy, label: 'Copiar', shortcut: 'Ctrl+C', onClick: actions.copy })}
                    {renderItem({ icon: Scissors, label: 'Cortar', shortcut: 'Ctrl+X', onClick: actions.cut })}
                    {renderItem({ icon: CopyPlus, label: 'Duplicar', shortcut: 'Ctrl+D', onClick: actions.duplicate })}
                    {renderDivider()}
                    {renderItem({ icon: Trash2, label: 'Eliminar Selección', shortcut: 'Del', onClick: actions.delete, danger: true })}
                </>
            )}

            {type === 'edge' && (
                <>
                    <div className="menu-header">Conexión</div>
                    {renderItem({ icon: Trash2, label: 'Eliminar', shortcut: 'Del', onClick: actions.delete, danger: true })}
                </>
            )}

            {type === 'canvas' && (
                <>
                    <div className="menu-header">Canvas</div>
                    {renderItem({ icon: PlusCircle, label: 'Agregar Nodo', onClick: actions.addNode })}
                    {renderItem({ icon: MousePointer2, label: 'Seleccionar Todo', shortcut: 'Ctrl+A', onClick: actions.selectAll })}
                    {renderDivider()}
                    {renderItem({ icon: Copy, label: 'Pegar', shortcut: 'Ctrl+V', onClick: actions.paste, disabled: !actions.canPaste })}
                    {renderDivider()}
                    {renderItem({ icon: Undo2, label: 'Deshacer', shortcut: 'Ctrl+Z', onClick: actions.undo, disabled: !actions.canUndo })}
                    {renderItem({ icon: Redo2, label: 'Rehacer', shortcut: 'Ctrl+Y', onClick: actions.redo, disabled: !actions.canRedo })}
                </>
            )}
        </div>
    );
};

export default ContextMenu;
