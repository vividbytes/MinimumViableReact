function flatten(arr) {
    return arr.reduce((flat, toFlatten) =>
        flat.concat(Array.isArray(toFlatten) ?
            flatten(toFlatten) :
            toFlatten
        )
    , []);
}

const createElement = (type, attributes = {}, children = []) => {
    const childElements = flatten(children).map(child => (
        typeof child === 'string' ?
        createElement('text', { textContent: child }) :
        child
    )).filter(child => child);

    return {
        type,
        children: childElements,
        props: Object.assign(
            { children: childElements },
            attributes
        )
    };
};

class Component {
    constructor(props) {
        this.props = props || {};
        this.state = {};
        this.onStateChange = () => {};
        this._domElement = null;
    }

    componentWillMount() {}

    componentDidMount() {}

    componentWillReceiveProps() {}

    shouldComponentUpdate() { return true; }

    componentWillUpdate() {}

    componentDidUpdate() {}

    componentWillUnmount() {}

    setState(newState) {
        const prevState = this.state;
        const nextState = Object.assign({}, prevState || {}, newState);
        this.onStateChange(this, nextState);
    }

    setStateCallback(cb) {
        this.onStateChange = cb;
    }

    setChild(component) {
        this._child = component;
        component._parentComponent = this;
    }

    getDomElement() {
        return this._domElement;
    }

    setDomElement(domElement) {
        this._domElement = domElement;
    }

    getChild() {
        return this._child;
    }

    getRoot() {
        let component = this;
        let res;
        while (component) {
            res = component;
            component = component._parentComponent;
        }
        return res;
    }

    updateProps(newProps) {
        this.props = newProps;
    }

    updateState(newState) {
        this.state = newState;
    }

    render() {}
}

export default {
    createElement,
    Component
};
