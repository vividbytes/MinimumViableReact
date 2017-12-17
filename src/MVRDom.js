const Reconciler = {

    diff: (virtualElement, container, oldDomElement, parentComponent) => {
        const oldVirtualElement = oldDomElement && oldDomElement._virtualElement;
        const oldComponent = oldVirtualElement && oldVirtualElement.component;

        if (typeof virtualElement.type === 'function') {
            Reconciler.diffComponent(virtualElement, oldComponent, container, oldDomElement, parentComponent);
        } else if (
            oldVirtualElement &&
            oldVirtualElement.type === virtualElement.type &&
            oldComponent === virtualElement.component
        ) {
            if (oldVirtualElement.type === 'text') {
                Reconciler.updateTextNode(oldDomElement, virtualElement, oldVirtualElement);
            } else {
                Reconciler.updateDomElement(oldDomElement, virtualElement, oldVirtualElement);
            }

            // save the virtualElement on the domElement
            // so that we can retrieve it next time
            oldDomElement._virtualElement = virtualElement;

            Reconciler.diffList(virtualElement.children, oldDomElement);
        } else {
            Reconciler.mountElement(virtualElement, container, oldDomElement);
        }
    },

    getKey: (virtualElement) => {
        if (!virtualElement) { return undefined; }

        const component = virtualElement.component;

        return component ? component.props.key : virtualElement.props.key;
    },

    diffList: (virtualElements, parentDomElement) => {
        const keyedElements = {};
        const unkeyedElements = [];

        for (let i = 0; i < parentDomElement.childNodes.length; i += 1) {
            const domElement = parentDomElement.childNodes[i];
            const key = Reconciler.getKey(domElement._virtualElement);

            if (key) {
                keyedElements[key] = domElement;
            } else {
                unkeyedElements.push(domElement);
            }
        }

        let unkeyedIndex = 0;
        virtualElements.forEach((virtualElement, i) => {
            const key = virtualElement.props.key;
            if (key) {
                const keyedDomElement = keyedElements[key];
                if (keyedDomElement) {
                    // move to correct location
                    if (
                        parentDomElement.childNodes[i] &&
                        !parentDomElement.childNodes[i].isSameNode(keyedDomElement)
                    ) {
                        if (parentDomElement.childNodes[i]) {
                            parentDomElement.insertBefore(
                                keyedDomElement,
                                parentDomElement.childNodes[i]
                            );
                        } else {
                            parentDomElement.append(keyedDomElement);
                        }
                    }

                    Reconciler.diff(virtualElement, parentDomElement, keyedDomElement);
                } else {
                    const placeholder = document.createElement('span');
                    if (parentDomElement.childNodes[i]) {
                        parentDomElement.insertBefore(placeholder, parentDomElement.childNodes[i]);
                    } else {
                        parentDomElement.append(placeholder);
                    }
                    Reconciler.mountElement(virtualElement, parentDomElement, placeholder);
                }
            } else {
                const unkeyedDomElement = unkeyedElements[unkeyedIndex];
                if (unkeyedElements) {
                    if (
                        parentDomElement.childNodes[i] &&
                        !parentDomElement.childNodes[i].isSameNode(unkeyedDomElement)
                    ) {
                        if (parentDomElement.childNodes[i]) {
                            parentDomElement.insertBefore(
                                unkeyedDomElement,
                                parentDomElement.childNodes[i]
                            );
                        } else {
                            parentDomElement.append(unkeyedDomElement);
                        }
                    }

                    Reconciler.diff(virtualElement, parentDomElement, unkeyedDomElement);
                } else {
                    const placeholder = document.createElement('span');
                    if (parentDomElement.childNodes[i]) {
                        parentDomElement.insertBefore(placeholder, parentDomElement.childNodes[i]);
                    } else {
                        parentDomElement.append(placeholder);
                    }
                    Reconciler.mountElement(virtualElement, parentDomElement, placeholder);
                }
                unkeyedIndex += 1;
            }
        });


        // remove extra children
        const oldChildren = parentDomElement.childNodes;
        while (oldChildren.length > virtualElements.length) {
            Reconciler.unmountNode(oldChildren[virtualElements.length]);
        }
    },

    diffComponent: (newVirtualElement, oldComponent, container, domElement, parentComponent) => {
        if (
            oldComponent &&
            newVirtualElement.type === oldComponent.constructor
        ) {
            oldComponent.componentWillReceiveProps(newVirtualElement.props);

            if (oldComponent.shouldComponentUpdate(newVirtualElement.props)) {
                const prevProps = oldComponent.props;
                oldComponent.componentWillUpdate(newVirtualElement.props, oldComponent.state);

                // update component
                oldComponent.updateProps(newVirtualElement.props);
                const nextElement = oldComponent.render();
                nextElement.component = parentComponent || oldComponent;

                const childComponent = oldComponent.getChild();

                if (childComponent) {
                    Reconciler.diffComponent(
                        nextElement,
                        childComponent,
                        container,
                        domElement,
                        oldComponent
                    );
                } else {
                    Reconciler.diff(nextElement, container, domElement, oldComponent);
                }

                oldComponent.componentDidUpdate(prevProps);
            }
        } else {
            let component = oldComponent;
            while (component) {
                component.componentWillUnmount();
                component._didUnmount = true;
                component.setDomElement(null);
                component = component.getChild();
            }

            Reconciler.mountElement(newVirtualElement, container, domElement, parentComponent);
        }
    },

    unmountNode: (domElement, parentComponent) => {
        const virtualElement = domElement._virtualElement;
        if (!virtualElement) {
            domElement.remove();
            return;
        }

        if (!parentComponent) {
            let component = virtualElement.component;
            while (component && !component._didUnmount) {
                component.componentWillUnmount();
                component.setDomElement(undefined);
                component = component.getChild();
            }
        }

        while (domElement.childNodes.length > 0) {
            Reconciler.unmountNode(domElement.firstChild);
        }

        if (virtualElement.props.ref) {
            virtualElement.props.ref(null);
        }

        Object.keys(virtualElement.props).forEach((propName) => {
            if (propName.slice(0, 2) === 'on') {
                const event = propName.toLowerCase().slice(2);
                const handler = virtualElement.props[propName];
                domElement.removeEventListener(event, handler);
            }
        });

        domElement.remove();
    },

    updateTextNode: (domElement, newVirtualElement, oldVirtualElement) => {
        if (newVirtualElement.props.textContent !== oldVirtualElement.props.textContent) {
            domElement.textContent = newVirtualElement.props.textContent;
        }

        // save the virtualElement on the domElement
        // so that we can retrieve it next time
        domElement._virtualElement = newVirtualElement;
    },

    updateDomElement: (domElement, newVirtualElement, oldVirtualElement = {}) => {
        const newProps = newVirtualElement.props;
        const oldProps = oldVirtualElement.props || {};

        Object.keys(newProps).forEach((propName) => {
            const newProp = newProps[propName];
            const oldProp = oldProps[propName];

            if (newProp !== oldProp) {
                if (propName.slice(0, 2) === 'on') {
                    // prop is an event handler
                    const eventName = propName.toLowerCase().slice(2);
                    domElement.addEventListener(eventName, newProp, false);
                    if (oldProp) {
                        domElement.removeEventListener(eventName, oldProp, false);
                    }
                } else if (propName === 'value' || propName === 'checked') {
                    // this are special attributes that cannot be set
                    // using setAttribute
                    domElement[propName] = newProp;
                } else if (propName !== 'key' && propName !== 'children') { // ignore the 'children' prop
                    domElement.setAttribute(propName, newProps[propName]);
                }
            }
        });

        // remove oldProps
        Object.keys(oldProps).forEach((propName) => {
            const newProp = newProps[propName];
            const oldProp = oldProps[propName];

            if (!newProp) {
                if (propName.slice(0, 2) === 'on') {
                    // prop is an event handler
                    domElement.removeEventListener(propName, oldProp, false);
                } else if (propName !== 'children') { // ignore the 'children' prop
                    domElement.removeAttribute(propName);
                }
            }
        });
    },

    mountComponent: (virtualElement, container, oldDomElement, parentComponent) => {
        const component = new virtualElement.type(virtualElement.props);
        component.setStateCallback(Reconciler.handleComponentStateChange);

        const nextElement = component.render();

        if (parentComponent) {
            const root = parentComponent.getRoot();
            nextElement.component = root;
            parentComponent.setChild(component);
        } else {
            nextElement.component = component;
        }

        component.componentWillMount();

        if (typeof nextElement.type === 'function') {
            Reconciler.mountComponent(nextElement, container, oldDomElement, component);
        } else {
            Reconciler.mountElement(nextElement, container, oldDomElement, parentComponent);
        }

        component.componentDidMount();

        if (component.props.ref) {
            component.props.ref(component);
        }
    },

    handleComponentStateChange(component, nextState) {
        const prevState = component.state;
        if (component.shouldComponentUpdate(component.props, nextState)) {
            component.componentWillUpdate(component.props, nextState);
            component.updateState(nextState);

            const nextElement = component.render();
            nextElement.component = component.getRoot();

            // start the normal diffing process here
            const domElement = component.getDomElement();
            const container = domElement.parentNode;
            const childComponent = component.getChild();
            if (childComponent) {
                Reconciler.diffComponent(
                    nextElement,
                    childComponent,
                    container,
                    domElement,
                    component
                );
            } else {
                Reconciler.diff(nextElement, container, domElement, component);
            }

            component.componentDidUpdate(component.props, prevState);
        }
    },

    mountSimpleNode: (virtualElement, container, oldDomElement, parentComponent) => {
        let newDomElement;
        const nextSibling = oldDomElement && oldDomElement.nextSibling;

        if (virtualElement.type === 'text') {
            newDomElement = document.createTextNode(virtualElement.props.textContent);
        } else {
            newDomElement = document.createElement(virtualElement.type);
            // set dom-node attributes
            Reconciler.updateDomElement(newDomElement, virtualElement);
        }

        // save the virtualElement on the domElement
        // so that we can retrieve it next time
        newDomElement._virtualElement = virtualElement;

        // remove the old node from the dom if one exists
        if (oldDomElement) {
            Reconciler.unmountNode(oldDomElement, parentComponent);
        }

        // add the newly created node to the dom
        if (nextSibling) {
            container.insertBefore(newDomElement, nextSibling);
        } else {
            container.appendChild(newDomElement);
        }

        // add reference to domElement into component
        let component = virtualElement.component;
        while (component) {
            component.setDomElement(newDomElement);
            component = component.getChild();
        }

        // recursively call mountElement with all child virtualElements
        virtualElement.children.forEach((childElement) => {
            Reconciler.mountElement(childElement, newDomElement);
        });

        if (virtualElement.props.ref) {
            virtualElement.props.ref(newDomElement);
        }
    },

    mountElement: (virtualElement, container, oldDomElement, parentComponent) => {
        if (typeof virtualElement.type === 'function') {
            Reconciler.mountComponent(virtualElement, container, oldDomElement, parentComponent);
        } else {
            Reconciler.mountSimpleNode(virtualElement, container, oldDomElement, parentComponent);
        }
    }
};

export default {

    render: (virtualElement, container) => {
        Reconciler.diff(virtualElement, container, container.firstChild);
    }

};

