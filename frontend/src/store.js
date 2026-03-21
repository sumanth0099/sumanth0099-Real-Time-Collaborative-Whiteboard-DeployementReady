import { create } from 'zustand';

export const useStore = create((set) => ({
  objects: [],
  undoStack: [],
  redoStack: [],
  setObjects: (objects) => set({ objects }),
  addObject: (obj, isLocal = false) => set((state) => {
    const newState = { objects: [...state.objects, obj] };
    if (isLocal) {
      newState.undoStack = [...state.undoStack, { type: 'add', obj }];
      newState.redoStack = [];
    }
    return newState;
  }),
  updateObject: (id, newProps, isLocal = false) => set((state) => {
    const oldObj = state.objects.find(o => o.id === id);
    const newState = {
      objects: state.objects.map((obj) => obj.id === id ? { ...obj, ...newProps } : obj)
    };
    if (isLocal && oldObj) {
        // For performance, we might not want to push every mouseMove to undo stack.
        // We'll handle finalizing the action in the component.
    }
    return newState;
  }),
  // Specifically for undo/redo
  applyUndo: () => {
    let undoneAction = null;
    set((state) => {
      if (state.undoStack.length === 0) return state;
      const newUndoStack = [...state.undoStack];
      undoneAction = newUndoStack.pop();
      
      let newObjects = state.objects;
      if (undoneAction.type === 'add') {
        newObjects = state.objects.filter(o => o.id !== undoneAction.obj.id);
      }
      
      return {
        objects: newObjects,
        undoStack: newUndoStack,
        redoStack: [...state.redoStack, undoneAction]
      };
    });
    return undoneAction;
  },
  applyRedo: () => {
    let redoneAction = null;
    set((state) => {
      if (state.redoStack.length === 0) return state;
      const newRedoStack = [...state.redoStack];
      redoneAction = newRedoStack.pop();
      
      let newObjects = state.objects;
      if (redoneAction.type === 'add') {
        newObjects = [...state.objects, redoneAction.obj];
      }
      
      return {
        objects: newObjects,
        undoStack: [...state.undoStack, redoneAction],
        redoStack: newRedoStack
      };
    });
    return redoneAction;
  },
  removeObjectRemote: (id) => set((state) => ({
    objects: state.objects.filter(o => o.id !== id),
    // Also remove from local undo/redo if it was there (rare case)
    undoStack: state.undoStack.filter(a => a.obj.id !== id),
    redoStack: state.redoStack.filter(a => a.obj.id !== id)
  })),
  currentTool: 'pen', // 'pen' | 'rectangle'
  setCurrentTool: (tool) => set({ currentTool: tool }),
  brushColor: '#000000',
  setBrushColor: (color) => set({ brushColor: color }),
  brushSize: 5,
  setBrushSize: (size) => set({ brushSize: size }),
}));
