class Documentation {
    constructor() {
      this.module = {
        name: '',
        desc: '',
        functions: []
      };
    }
  }
  
  class FunctionDoc {
    constructor(name) {
      this.name = name;
      this.desc = '';
      this.params = []; // Array of { name, type, desc }
      this.return = { type: '', desc: '' };
    }
  }
  
  module.exports = { Documentation, FunctionDoc };