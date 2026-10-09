const { del } = require("object-path");

const DataService = {
  fillMetadata(resource) {
    if (Array.isArray(resource)) {
      resource.forEach(e => {
        this.spreadObject(e);
      });
    } else {
      this.spreadObject(resource);
    }

    return resource;
  },

  spreadObject(obj) {
    if (obj.metadata) {
      Object.keys(obj.metadata).forEach(k => {
        obj[k] = obj.metadata[k] !== null ? obj.metadata[k] : obj[k];
      });
      del(obj.metadata);
    }

    if (obj.details) {
      Object.keys(obj.details).forEach(k => {
        obj[k] = obj.details[k] !== null ? obj.details[k] : obj[k];
      });
      del(obj.details);
    }
  }
};

export default DataService;
