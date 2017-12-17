/* eslint-disable no-unused-expressions */
/* eslint-disable class-methods-use-this */

import sinon from 'sinon';
import chai from 'chai';
import sinonChai from 'sinon-chai';
import MVR from '../src/part4/MVR';
import MVRDom from '../src/part4/MVRDom';

const expect = chai.expect;
chai.use(sinonChai);

const EMPTY_CHILDREN = [];

describe('Lifecycle methods', () => {
    let scratch;

    before(() => {
        scratch = document.createElement('div');
        (document.body || document.documentElement).appendChild(scratch);
    });

    beforeEach(() => {
        scratch.innerHTML = '';
    });

    after(() => {
        scratch.parentNode.removeChild(scratch);
        scratch = null;
    });

    describe('#componentWillUpdate', () => {
        it('should NOT be called on initial render', () => {
            class ReceivePropsComponent extends MVR.Component {
                componentWillUpdate() {}
                render() {
                    return MVR.createElement('div');
                }
            }
            sinon.spy(ReceivePropsComponent.prototype, 'componentWillUpdate');
            MVRDom.render(MVR.createElement(ReceivePropsComponent), scratch);
            expect(ReceivePropsComponent.prototype.componentWillUpdate).not.to.have.been.called;
        });

        it('should be called when rerender with new props from parent', () => {
            let doRender;

            class Inner extends MVR.Component {
                componentWillUpdate(nextProps, nextState) {
                    expect(nextProps).to.be.deep.equal({ children: EMPTY_CHILDREN, i: 1 });
                    expect(nextState).to.be.deep.equal({});
                }
                render() {
                    return MVR.createElement('div');
                }
            }

            class Outer extends MVR.Component {
                constructor(p, c) {
                    super(p, c);
                    this.state = { i: 0 };
                }
                componentDidMount() {
                    doRender = () => this.setState({ i: this.state.i + 1 });
                }
                render() {
                    const { i } = this.state;
                    return MVR.createElement(Inner, Object.assign({ i }, this.props));
                }
            }

            sinon.spy(Inner.prototype, 'componentWillUpdate');
            sinon.spy(Outer.prototype, 'componentDidMount');

            // Initial render
            MVRDom.render(MVR.createElement(Outer), scratch);
            expect(Inner.prototype.componentWillUpdate).not.to.have.been.called;

            // Rerender inner with new props
            doRender();
            expect(Inner.prototype.componentWillUpdate).to.have.been.called;
        });

        it('should be called on new state', () => {
            let doRender;
            class ReceivePropsComponent extends MVR.Component {
                componentWillUpdate() {}
                componentDidMount() {
                    doRender = () => this.setState({ i: this.state.i + 1 });
                }
                render() {
                    return MVR.createElement('div');
                }
            }
            sinon.spy(ReceivePropsComponent.prototype, 'componentWillUpdate');
            MVRDom.render(MVR.createElement(ReceivePropsComponent), scratch);
            expect(ReceivePropsComponent.prototype.componentWillUpdate).not.to.have.been.called;

            doRender();
            expect(ReceivePropsComponent.prototype.componentWillUpdate).to.have.been.called;
        });

        it('should be called after children are mounted', () => {
            const log = [];

            class Inner extends MVR.Component {
                componentDidMount() {
                    log.push('Inner mounted');

                    // Verify that the component is actually mounted when this
                    // callback is invoked.
                    expect(scratch.querySelector('#inner')).to.equal(this._domElement);
                }

                render() {
                    return MVR.createElement('div', {
                        id: 'inner'
                    });
                }
            }

            class Outer extends MVR.Component {
                componentDidUpdate() {
                    log.push('Outer updated');
                }

                render() {
                    return this.props.renderInner ?
                        MVR.createElement(Inner) :
                        MVR.createElement('div');
                }
            }

            MVRDom.render(
                MVR.createElement(Outer, {
                    renderInner: false
                }),
                scratch
            );

            MVRDom.render(
                MVR.createElement(Outer, {
                    renderInner: true
                }),
                scratch
            );

            expect(log).to.deep.equal(['Inner mounted', 'Outer updated']);
        });
    });

    describe('#componentWillReceiveProps', () => {
        it('should NOT be called on initial render', () => {
            class ReceivePropsComponent extends MVR.Component {
                componentWillReceiveProps() {}
                render() {
                    return MVR.createElement('div');
                }
            }
            sinon.spy(ReceivePropsComponent.prototype, 'componentWillReceiveProps');
            MVRDom.render(MVR.createElement(ReceivePropsComponent), scratch);
            expect(ReceivePropsComponent.prototype.componentWillReceiveProps).not.to.have.been.called;
        });

        it('should be called when rerender with new props from parent', () => {
            let doRender;

            class Inner extends MVR.Component {
                componentWillMount() {
                    expect(this.props.i).to.be.equal(0);
                }
                componentWillReceiveProps(nextProps) {
                    expect(nextProps.i).to.be.equal(1);
                }
                render() {
                    return MVR.createElement('div');
                }
            }

            class Outer extends MVR.Component {
                constructor(p, c) {
                    super(p, c);
                    this.state = { i: 0 };
                }
                componentDidMount() {
                    doRender = () => this.setState({ i: this.state.i + 1 });
                }
                render() {
                    const { i } = this.state;
                    return MVR.createElement(Inner, Object.assign({ i }, this.props));
                }
            }

            sinon.spy(Inner.prototype, 'componentWillReceiveProps');
            sinon.spy(Outer.prototype, 'componentDidMount');

            // Initial render
            MVRDom.render(MVR.createElement(Outer), scratch);
            expect(Inner.prototype.componentWillReceiveProps).not.to.have.been.called;

            // Rerender inner with new props
            doRender();
            expect(Inner.prototype.componentWillReceiveProps).to.have.been.called;
        });

        it('should be called in right execution order', () => {
            let doRender;

            class Inner extends MVR.Component {
                componentDidUpdate() {
                    expect(Inner.prototype.componentWillReceiveProps).to.have.been.called;
                    expect(Inner.prototype.componentWillUpdate).to.have.been.called;
                }
                componentWillReceiveProps() {
                    expect(Inner.prototype.componentWillUpdate).not.to.have.been.called;
                    expect(Inner.prototype.componentDidUpdate).not.to.have.been.called;
                }
                componentWillUpdate() {
                    expect(Inner.prototype.componentWillReceiveProps).to.have.been.called;
                    expect(Inner.prototype.componentDidUpdate).not.to.have.been.called;
                }
                render() {
                    return MVR.createElement('div');
                }
            }

            class Outer extends MVR.Component {
                constructor(p, c) {
                    super(p, c);
                    this.state = { i: 0 };
                }
                componentDidMount() {
                    doRender = () => this.setState({ i: this.state.i + 1 });
                }
                render() {
                    const { i } = this.state;
                    return MVR.createElement(Inner, Object.assign({ i }, this.props));
                }
            }

            sinon.spy(Inner.prototype, 'componentWillReceiveProps');
            sinon.spy(Inner.prototype, 'componentDidUpdate');
            sinon.spy(Inner.prototype, 'componentWillUpdate');
            sinon.spy(Outer.prototype, 'componentDidMount');

            MVRDom.render(MVR.createElement(Outer), scratch);
            doRender();

            expect(Inner.prototype.componentWillReceiveProps).to.have.been.calledBefore(Inner.prototype.componentWillUpdate);
            expect(Inner.prototype.componentWillUpdate).to.have.been.calledBefore(Inner.prototype.componentDidUpdate);
        });
    });


    describe('top-level componentWillUnmount', () => {
        it('should invoke componentWillUnmount for top-level components', () => {
            class Foo extends MVR.Component {
                componentDidMount() {}
                componentWillUnmount() {}
                render() {
                    return MVR.createElement('div');
                }
            }

            class Bar extends MVR.Component {
                componentDidMount() {}
                componentWillUnmount() {}
                render() {
                    return MVR.createElement('div');
                }
            }

            sinon.spy(Foo.prototype, 'componentDidMount');
            sinon.spy(Foo.prototype, 'componentWillUnmount');
            sinon.spy(Bar.prototype, 'componentDidMount');
            sinon.spy(Bar.prototype, 'componentWillUnmount');

            MVRDom.render(MVR.createElement(Foo), scratch);
            expect(Foo.prototype.componentDidMount, 'initial render').to.have.been.calledOnce;

            MVRDom.render(MVR.createElement(Bar), scratch);
            expect(Foo.prototype.componentWillUnmount, 'when replaced').to.have.been.calledOnce;
            expect(Bar.prototype.componentDidMount, 'when replaced').to.have.been.calledOnce;

            MVRDom.render(MVR.createElement('div'), scratch);
            expect(Bar.prototype.componentWillUnmount, 'when removed').to.have.been.calledOnce;
        });
    });


    describe('#constructor and component(Did|Will)(Mount|Unmount)', () => {
        let setState;

        class LifecycleTestComponent extends MVR.Component {
            constructor(p, c) { super(p, c); this._constructor(); }
            _constructor() {}
            componentWillMount() {}
            componentDidMount() {}
            componentWillUnmount() {}
            render() { return MVR.createElement('div'); }
        }

        class InnerMost extends LifecycleTestComponent {
            render() { return MVR.createElement('div'); }
        }

        class Inner extends LifecycleTestComponent {
            render() {
                return (
                    MVR.createElement('div', {}, [
                        MVR.createElement(InnerMost)
                    ])
                );
            }
        }

        class Outer extends MVR.Component {
            constructor(p, c) {
                super(p, c);
                this.state = { show: true };
                setState = s => this.setState(s);
            }
            render() {
                const { show } = this.state;
                return (
                    MVR.createElement('div', {}, [
                        show && (
                            MVR.createElement(Inner, this.props)
                        )
                    ])
                );
            }
        }

        const spies = ['_constructor', 'componentWillMount', 'componentDidMount', 'componentWillUnmount'];

        const verifyLifycycleMethods = (TestComponent) => {
            const proto = TestComponent.prototype;
            spies.forEach(s => sinon.spy(proto, s));
            const reset = () => spies.forEach(s => proto[s].reset());

            it('should be invoked for components on initial render', () => {
                reset();
                MVRDom.render(MVR.createElement(Outer), scratch);
                expect(proto._constructor).to.have.been.called;
                expect(proto.componentDidMount).to.have.been.called;
                expect(proto.componentWillMount).to.have.been.calledBefore(proto.componentDidMount);
                expect(proto.componentDidMount).to.have.been.called;
            });

            it('should be invoked for components on unmount', () => {
                reset();
                setState({ show: false });

                expect(proto.componentWillUnmount).to.have.been.called;
            });

            it('should be invoked for components on re-render', () => {
                reset();
                setState({ show: true });

                expect(proto._constructor).to.have.been.called;
                expect(proto.componentDidMount).to.have.been.called;
                expect(proto.componentWillMount).to.have.been.calledBefore(proto.componentDidMount);
                expect(proto.componentDidMount).to.have.been.called;
            });
        };

        describe('inner components', () => {
            verifyLifycycleMethods(Inner);
        });

        describe('innermost components', () => {
            verifyLifycycleMethods(InnerMost);
        });

        describe('when shouldComponentUpdate() returns false', () => {
            let setState; // eslint-disable-line no-shadow

            // eslint-disable-next-line no-shadow
            class Inner extends MVR.Component {
                shouldComponentUpdate() { return false; }
                componentWillMount() {}
                componentDidMount() {}
                componentWillUnmount() {}
                render() {
                    return MVR.createElement('div');
                }
            }

            // eslint-disable-next-line no-shadow
            class Outer extends MVR.Component {
                constructor() {
                    super();
                    this.state = { show: true };
                    setState = s => this.setState(s);
                }
                render() {
                    const { show } = this.state;
                    return (
                        MVR.createElement('div', {}, [
                            show && (
                                MVR.createElement('div', {}, [
                                    MVR.createElement(Inner, this.props)
                                ])
                            )
                        ])
                    );
                }
            }

            const proto = Inner.prototype;
            // eslint-disable-next-line no-shadow
            const spies = ['componentWillMount', 'componentDidMount', 'componentWillUnmount'];
            spies.forEach(s => sinon.spy(proto, s));

            const reset = () => spies.forEach(s => proto[s].reset());

            beforeEach(() => reset());

            it('should be invoke normally on initial mount', () => {
                MVRDom.render(MVR.createElement(Outer), scratch);
                expect(proto.componentWillMount).to.have.been.called;
                expect(proto.componentWillMount).to.have.been.calledBefore(proto.componentDidMount);
                expect(proto.componentDidMount).to.have.been.called;
            });

            it('should be invoked normally on unmount', () => {
                setState({ show: false });

                expect(proto.componentWillUnmount).to.have.been.called;
            });

            it('should still invoke mount for shouldComponentUpdate():false', () => {
                setState({ show: true });

                expect(proto.componentWillMount).to.have.been.called;
                expect(proto.componentWillMount).to.have.been.calledBefore(proto.componentDidMount);
                expect(proto.componentDidMount).to.have.been.called;
            });

            it('should still invoke unmount for shouldComponentUpdate():false', () => {
                setState({ show: false });

                expect(proto.componentWillUnmount).to.have.been.called;
            });
        });
    });


    describe('shouldComponentUpdate', () => {
        let setState;

        class Should extends MVR.Component {
            constructor() {
                super();
                this.state = { show: true };
                setState = s => this.setState(s);
            }
            render() {
                const { show } = this.state;
                return show ? MVR.createElement('div') : MVR.createElement('span');
            }
        }

        class ShouldNot extends Should {
            shouldComponentUpdate() {
                return false;
            }
        }

        sinon.spy(Should.prototype, 'render');
        sinon.spy(ShouldNot.prototype, 'shouldComponentUpdate');

        beforeEach(() => Should.prototype.render.reset());

        it('should rerender component on change by default', () => {
            MVRDom.render(MVR.createElement(Should), scratch);
            setState({ show: false });

            expect(Should.prototype.render).to.have.been.calledTwice;
        });

        it('should not rerender component if shouldComponentUpdate returns false', () => {
            MVRDom.render(MVR.createElement(ShouldNot), scratch);
            setState({ show: false });

            expect(ShouldNot.prototype.shouldComponentUpdate).to.have.been.calledOnce;
            expect(ShouldNot.prototype.render).to.have.been.calledOnce;
        });
    });


    describe('Lifecycle DOM Timing', () => {
        it('should be invoked when dom does (DidMount, WillUnmount) or does not (WillMount, DidUnmount) exist', () => {
            let setState;

            class Inner extends MVR.Component {
                componentWillMount() {
                    expect(document.getElementById('InnerDiv'), 'Inner componentWillMount').to.not.exist;
                }
                componentDidMount() {
                    expect(document.getElementById('InnerDiv'), 'Inner componentDidMount').to.exist;
                }
                componentWillUnmount() {
                    setTimeout(() => {
                        expect(document.getElementById('InnerDiv'), 'Inner after componentWillUnmount').to.not.exist;
                    }, 0);
                }

                render() {
                    return MVR.createElement('div', { id: 'InnerDiv' });
                }
            }

            class Outer extends MVR.Component {
                constructor() {
                    super();
                    this.state = { show: true };
                    setState = (s) => {
                        this.setState(s);
                    };
                }
                componentWillMount() {
                    expect(document.getElementById('OuterDiv'), 'Outer componentWillMount').to.not.exist;
                }
                componentDidMount() {
                    expect(document.getElementById('OuterDiv'), 'Outer componentDidMount').to.exist;
                }
                componentWillUnmount() {
                    expect(document.getElementById('OuterDiv'), 'Outer componentWillUnmount').to.exist;
                    setTimeout(() => {
                        expect(document.getElementById('OuterDiv'), 'Outer after componentWillUnmount').to.not.exist;
                    }, 0);
                }
                render() {
                    const { show } = this.state;
                    return (
                        MVR.createElement('div', { id: 'OuterDiv' }, [
                            show && (
                                MVR.createElement('div', {}, [
                                    MVR.createElement(Inner, this.props)
                                ])
                            )
                        ])
                    );
                }
            }

            const proto = Inner.prototype;
            const spies = ['componentWillMount', 'componentDidMount', 'componentWillUnmount'];
            spies.forEach(s => sinon.spy(proto, s));

            const reset = () => spies.forEach(s => proto[s].reset());

            MVRDom.render(MVR.createElement(Outer), scratch);
            expect(proto.componentWillMount).to.have.been.called;
            expect(proto.componentWillMount).to.have.been.calledBefore(proto.componentDidMount);
            expect(proto.componentDidMount).to.have.been.called;

            reset();
            setState({ show: false });

            expect(proto.componentWillUnmount).to.have.been.called;

            reset();
            setState({ show: true });

            expect(proto.componentWillMount).to.have.been.called;
            expect(proto.componentWillMount).to.have.been.calledBefore(proto.componentDidMount);
            expect(proto.componentDidMount).to.have.been.called;
        });
    });

    it('should remove this._domElement for HOC', (done) => {
        const promises = [];

        const createComponent = (name, fn) => {
            class C extends MVR.Component {
                componentWillUnmount() {
                    expect(this._domElement, `${name}.componentWillUnmount`).to.exist;
                    promises.push(new Promise((resolve, reject) => {
                        setTimeout(() => {
                            try {
                                expect(this._domElement, `after ${name}.componentWillUnmount`).not.to.exist;
                                resolve();
                            } catch (e) {
                                reject(e);
                            }
                        }, 0);
                    }));
                }
                render() { return fn(this.props); }
            }
            return C;
        };

        class Wrapper extends MVR.Component {
            render() {
                return MVR.createElement('div', {
                    class: 'wrapper'
                }, this.props.children);
            }
        }

        const One = createComponent('One', () => MVR.createElement(Wrapper, {}, ['one']));
        const Two = createComponent('Two', () => MVR.createElement(Wrapper, {}, ['two']));
        const Three = createComponent('Three', () => MVR.createElement(Wrapper, {}, ['three']));

        const components = [One, Two, Three];

        class Selector extends MVR.Component {
            render() {
                const Child = components[this.props.page];
                return Child ?
                    MVR.createElement(Child) :
                    MVR.createElement('div');
            }
        }

        class App extends MVR.Component {
            render() {
                const { page } = this.state;
                return MVR.createElement(Selector, { page });
            }
        }

        let app;
        MVRDom.render(
            MVR.createElement('div', {}, [
                MVR.createElement(App, {
                    ref: (c) => { app = c; }
                })
            ]),
            scratch
        );

        for (let i = 0; i < 20; i++) {
            app.setState({ page: i % components.length });
        }

        Promise.all(promises)
            .then(() => { done(); })
            .catch((e) => { done(e); });
    });
});
