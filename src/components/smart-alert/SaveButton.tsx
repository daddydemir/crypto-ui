import React, { useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import Modal from '../common/Modal'; // Ensure this path is correct based on folder structure
import { cn } from '../../lib/utils';

interface SaveButtonProps {
    nodes: any[];
    edges: any[];
    onSave?: () => void;
}

const SaveButton: React.FC<SaveButtonProps> = ({ nodes, edges, onSave }) => {
    const [name, setName] = useState('');
    const [showDialog, setShowDialog] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) {
            alert('Please enter a name');
            return;
        }

        setLoading(true);

        // Transform to backend format
        const mosaic = {
            name: name,
            description: '',
            blocks: nodes.map(node => ({
                id: node.id,
                type: node.data.blockType,
                config: node.data.config,
                connections: edges
                    .filter(edge => edge.source === node.id)
                    .map(edge => edge.target)
            }))
        };

        try {
            const response = await fetch('http://localhost:8080/api/v1/mosaics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(mosaic)
            });

            if (response.ok) {
                // Ideally replace with a toast
                alert('Mosaic saved successfully!');
                setShowDialog(false);
                setName('');
                onSave?.();
            } else {
                const error = await response.json();
                alert(`Error: ${error.message}`);
            }
        } catch (error) {
            alert('Failed to save mosaic');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
                    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                )}
                onClick={() => setShowDialog(true)}
            >
                <Save className="w-4 h-4" />
                Save Mosaic
            </button>

            <Modal
                isOpen={showDialog}
                onClose={() => setShowDialog(false)}
                title="Save Mosaic"
                maxWidth="max-w-md"
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="mosaic-name" className="text-sm font-medium text-foreground">
                            Mosaic Name
                        </label>
                        <input
                            id="mosaic-name"
                            type="text"
                            placeholder="Enter a descriptive name..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={cn(
                                "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                                "file:border-0 file:bg-transparent file:text-sm file:font-medium",
                                "placeholder:text-muted-foreground",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                "disabled:cursor-not-allowed disabled:opacity-50"
                            )}
                            autoFocus
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            onClick={() => setShowDialog(false)}
                            className="px-4 py-2 text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className={cn(
                                "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
                                "bg-primary text-primary-foreground hover:bg-primary/90",
                                "disabled:opacity-50 disabled:pointer-events-none"
                            )}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save'
                            )}
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default SaveButton;