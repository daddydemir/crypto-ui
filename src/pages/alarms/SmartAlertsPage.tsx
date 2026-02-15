import { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    addEdge,
    useNodesState,
    useEdgesState,
    type Connection,
    type Edge,
    ReactFlowProvider,
    type Node
} from 'reactflow';
import 'reactflow/dist/style.css';

// Components
import BlockNode from "@/components/smart-alert/BlockNode";
import BlockSidebar from "@/components/smart-alert/BlockSidebar";
import ConfigPanel from "@/components/smart-alert/ConfigPanel";
import SaveButton from "@/components/smart-alert/SaveButton";

const nodeTypes = {
    blockNode: BlockNode,
};

const SmartAlerts = () => {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);

    const onConnect = useCallback(
        (params: Edge | Connection) => {
            if (params.source === params.target) return; // Prevent self-loops

            setEdges((eds) => {
                // Check for cycles: Can we reach 'source' starting from 'target'?
                const isCyclic = (target: string, source: string, edges: Edge[]) => {
                    const stack = [target];
                    const visited = new Set();
                    while (stack.length > 0) {
                        const current = stack.pop();
                        if (current === source) return true;
                        if (!current || visited.has(current)) continue;
                        visited.add(current);

                        // Find all nodes connected FROM current
                        const outgoing = edges.filter(e => e.source === current).map(e => e.target);
                        stack.push(...outgoing);
                    }
                    return false;
                };

                if (params.target && params.source && isCyclic(params.target, params.source, eds)) {
                    console.warn("Circular connection detected");
                    return eds;
                }

                // Enforce 1-to-1 connections:
                // 1. Remove any existing edge from this source (single output)
                // 2. Remove any existing edge to this target (single input)
                const filteredEdges = eds.filter(e =>
                    e.source !== params.source && e.target !== params.target
                );
                return addEdge(params, filteredEdges);
            });
        },
        [setEdges]
    );

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            if (!reactFlowWrapper.current || !reactFlowInstance) return;

            const type = event.dataTransfer.getData('application/reactflow');
            if (!type) return;

            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode: Node = {
                id: `${type}-${Date.now()}`,
                type: 'blockNode',
                position,
                data: {
                    label: type.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
                    blockType: type,
                    config: {}
                },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [reactFlowInstance, setNodes]
    );

    // Node click handler
    const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
        event.stopPropagation(); // Prevent canvas click from potentially deselecting
        setSelectedNode(node);
    }, []);

    // Pane click handler (deselect node)
    const onPaneClick = useCallback(() => {
        setSelectedNode(null);
    }, []);

    // Config save handler
    const onConfigSave = useCallback((nodeId: string, config: any) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === nodeId) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            config,
                        },
                    };
                }
                return node;
            })
        );
    }, [setNodes]);

    // Delete block handler
    const onDeleteBlock = useCallback((id: string) => {
        setNodes((nds) => nds.filter((n) => n.id !== id));
        setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
        setSelectedNode(null);
    }, [setNodes, setEdges]);

    // Calculate and update node orders based on connectivity
    useEffect(() => {
        setNodes((nds) => {
            const adj = new Map<string, string[]>();
            const incoming = new Map<string, number>();

            nds.forEach(n => {
                adj.set(n.id, []);
                incoming.set(n.id, 0);
            });

            edges.forEach(e => {
                const list = adj.get(e.source);
                if (list) list.push(e.target);
                incoming.set(e.target, (incoming.get(e.target) || 0) + 1);
            });

            const depth = new Map<string, number>();
            const queue: { id: string, d: number }[] = [];

            // Initialize roots (nodes with no incoming edges)
            nds.forEach(n => {
                if ((incoming.get(n.id) || 0) === 0) {
                    depth.set(n.id, 1);
                    queue.push({ id: n.id, d: 1 });
                }
            });

            // BFS to assign orders
            while (queue.length > 0) {
                const { id, d } = queue.shift()!;
                const neighbors = adj.get(id) || [];
                neighbors.forEach(next => {
                    // Use max depth for order to represent "execution step"
                    if (!depth.has(next) || depth.get(next)! < d + 1) {
                        depth.set(next, d + 1);
                        queue.push({ id: next, d: d + 1 });
                    }
                });
            }

            // Check if any order actually changed to avoid infinite loop/re-renders
            const hasChanges = nds.some(n => n.data.order !== (depth.get(n.id) || 1));
            if (!hasChanges) return nds;

            return nds.map(n => ({
                ...n,
                data: { ...n.data, order: depth.get(n.id) || 1 }
            }));
        });
    }, [edges, nodes.length, setNodes]);

    return (
        <div className="flex h-full w-full bg-background overflow-hidden">
            <div className="flex-1 flex flex-col relative h-full">
                {/* Toolbar / Header Area */}
                <div className="h-14 border-b border-border bg-card flex items-center justify-between px-4 z-10">
                    <h1 className="text-lg font-semibold text-foreground">Smart Alert Builder</h1>
                    <div className="flex items-center gap-2">
                        {/* Status or other toolbar items could go here */}
                        <SaveButton nodes={nodes} edges={edges} />
                    </div>
                </div>

                {/* ReactFlow Canvas */}
                <div className="flex-1 relative" ref={reactFlowWrapper}>
                    <BlockSidebar />
                    <ReactFlowProvider>
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            onInit={setReactFlowInstance}
                            onDrop={onDrop}
                            onDragOver={onDragOver}
                            onNodeClick={onNodeClick}
                            onPaneClick={onPaneClick}
                            nodeTypes={nodeTypes}
                            fitView
                            className="bg-muted/10"
                        >
                            <Background color="oklch(var(--muted-foreground) / 0.2)" gap={16} />
                            <Controls className="bg-card border border-border shadow-sm rounded-md !left-4 !bottom-4" />
                        </ReactFlow>
                    </ReactFlowProvider>

                    {/* Config Panel Overlay */}
                    {selectedNode && (
                        <div className="absolute top-4 right-4 z-20 max-h-[calc(100%-4rem)] w-80 flex flex-col pointer-events-none">
                            <div className="pointer-events-auto h-full">
                                <ConfigPanel
                                    node={selectedNode}
                                    onClose={() => setSelectedNode(null)}
                                    onSave={onConfigSave}
                                    onDelete={onDeleteBlock}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SmartAlerts;