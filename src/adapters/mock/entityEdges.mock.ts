import { EntityEdge, EntityEdgesPort, EdgeType } from '@/ports/entityEdges';

const KEY = 'mock:entity_edges';

function read(): Record<string, EntityEdge[]> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

function write(db: Record<string, EntityEdge[]>) {
  localStorage.setItem(KEY, JSON.stringify(db));
}

export const entityEdgesMock: EntityEdgesPort = {
  async list(entity_id) {
    const db = read();
    return db[entity_id] || [];
  },

  async create(from_entity_id, to_entity_id, edge_type, options = {}) {
    const db = read();
    const edges = db[from_entity_id] || [];
    
    const newEdge: EntityEdge = {
      id: crypto.randomUUID(),
      from_entity_id,
      to_entity_id,
      edge_type,
      allow_crosspost: options.allow_crosspost ?? true,
      auto_propagate: options.auto_propagate ?? false,
      created_at: new Date().toISOString(),
    };
    
    db[from_entity_id] = [...edges, newEdge];
    write(db);
    
    return newEdge;
  },

  async update(edge_id, options) {
    const db = read();
    for (const entity_id in db) {
      const edge = db[entity_id].find(e => e.id === edge_id);
      if (edge) {
        if (options.allow_crosspost !== undefined) edge.allow_crosspost = options.allow_crosspost;
        if (options.auto_propagate !== undefined) edge.auto_propagate = options.auto_propagate;
        write(db);
        return;
      }
    }
  },

  async remove(edge_id) {
    const db = read();
    for (const entity_id in db) {
      db[entity_id] = db[entity_id].filter(e => e.id !== edge_id);
    }
    write(db);
  },
};
