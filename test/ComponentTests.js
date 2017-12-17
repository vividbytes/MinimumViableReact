/* eslint-disable no-unused-expressions */
/* eslint-disable no-bitwise */
/* eslint-disable class-methods-use-this */

import sinon from 'sinon';
import chai from 'chai';
import sinonChai from 'sinon-chai';
import MVR from '../src/part4/MVR';
import MVRDom from '../src/part4/MVRDom';

const expect = chai.expect;
chai.use(sinonChai);

function getAttributes(node) {
    const attrs = {};
    if (node.attributes) {
        for (let i = node.attributes.length; i--;) {
            attrs[node.attributes[i].name] = node.attributes[i].value;
        }
    }
    return attrs;
}

// hacky normalization of attribute order across browsers.
function sortAttributes(html) {
    return html.replace(/<([a-z0-9-]+)((?:\s[a-z0-9:_.-]+=".*?")+)((?:\s*\/)?>)/gi, (s, pre, attrs, after) => {
        const list = attrs.match(/\s[a-z0-9:_.-]+=".*?"/gi).sort((a, b) => (a > b ? 1 : -1));
        if (~after.indexOf('/')) after = `></${pre}>`;
        return `<${pre + list.join('') + after}`;
    });
}

describe('Components', () => {
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

    it('should render components', () => {
        class C1 extends MVR.Component {
            render() {
                return MVR.createElement('div', {}, ['C1']);
            }
        }

        sinon.spy(C1.prototype, 'render');

        MVRDom.render(MVR.createElement(C1), scratch);

        expect(C1.prototype.render)
            .to.have.been.calledOnce
            .and.to.have.returned(sinon.match({ type: 'div' }));

        expect(scratch.innerHTML).to.equal('<div>C1</div>');
    });

    it('should render components with props', () => {
        const PROPS = { foo: 'bar', onBaz: () => {} };
        let constructorProps;

        class C2 extends MVR.Component {
            constructor(props) {
                super(props);
                constructorProps = props;
            }

            render() {
                return MVR.createElement('div', this.props);
            }
        }

        sinon.spy(C2.prototype, 'render');

        MVRDom.render(MVR.createElement(C2, PROPS), scratch);

        expect(constructorProps).to.deep.include(PROPS);

        expect(C2.prototype.render)
            .to.have.been.calledOnce
            .and.to.have.returned(sinon.match({
                type: 'div',
                props: PROPS
            }));

        expect(scratch.innerHTML).to.equal('<div foo="bar"></div>');
    });

    it('should remove orphaned elements replaced by Components', () => {
        class Comp extends MVR.Component {
            render() {
                return MVR.createElement('span', {}, ['span in a component']);
            }
        }

        let root;
        function test(content) {
            root = MVRDom.render(content, scratch, root);
        }

        test(MVR.createElement(Comp));
        test(MVR.createElement('div', {}, ['just a div']));
        test(MVR.createElement(Comp));

        expect(scratch.innerHTML).to.equal('<span>span in a component</span>');
    });

    describe('High-Order Components', () => {
        it('should render nested components', () => {
            const PROPS = { foo: 'bar', onBaz: () => {} };

            class Inner extends MVR.Component {
                render() {
                    return MVR.createElement('div', this.props, ['inner']);
                }
            }

            class Outer extends MVR.Component {
                render() {
                    return MVR.createElement(Inner, this.props);
                }
            }

            const InnerSpy = sinon.spy(Inner.prototype, 'render');
            const OuterSpy = sinon.spy(Outer.prototype, 'render');

            MVRDom.render(MVR.createElement(Outer, PROPS), scratch);

            expect(OuterSpy)
                .to.have.been.calledOnce
                .and.to.have.returned(sinon.match({
                    type: Inner,
                    props: PROPS
                }));

            expect(InnerSpy)
                .to.have.been.calledOnce
                .and.to.have.returned(sinon.match({
                    type: 'div',
                    props: PROPS,
                    children: [MVR.createElement('text', { textContent: 'inner' })]
                }));

            expect(scratch.innerHTML).to.equal('<div foo="bar">inner</div>');
        });

        it('should re-render nested components', () => {
            let doRender = null,
                alt = false;

            let j = 0;
            class Inner extends MVR.Component {
                constructor(...args) {
                    super();
                    this._constructor(...args);
                }
                _constructor() {}
                componentWillMount() {}
                componentDidMount() {}
                componentWillUnmount() {}
                render() {
                    return MVR.createElement('div', Object.assign(
                        {
                            j: ++j // eslint-disable-line no-plusplus
                        },
                        this.props
                    ), ['inner']);
                }
            }

            class Outer extends MVR.Component {
                componentDidMount() {
                    let i = 1;
                    this.state = {};
                    doRender = () => this.setState({ i: ++i }); // eslint-disable-line no-plusplus
                }
                componentWillUnmount() {
                }
                render() {
                    if (alt) return MVR.createElement('div', { 'is-alt': true });
                    return MVR.createElement(Inner, Object.assign({ i: this.state.i }, this.props));
                }
            }

            sinon.spy(Outer.prototype, 'render');
            sinon.spy(Outer.prototype, 'componentDidMount');
            sinon.spy(Outer.prototype, 'componentWillUnmount');

            sinon.spy(Inner.prototype, '_constructor');
            sinon.spy(Inner.prototype, 'render');
            sinon.spy(Inner.prototype, 'componentWillMount');
            sinon.spy(Inner.prototype, 'componentDidMount');
            sinon.spy(Inner.prototype, 'componentWillUnmount');

            MVRDom.render(MVR.createElement(Outer, { foo: 'bar' }), scratch);

            expect(Outer.prototype.componentDidMount).to.have.been.calledOnce;

            doRender();

            expect(Outer.prototype.componentWillUnmount).not.to.have.been.called;

            expect(Inner.prototype._constructor).to.have.been.calledOnce;
            expect(Inner.prototype.componentWillUnmount).not.to.have.been.called;
            expect(Inner.prototype.componentWillMount).to.have.been.calledOnce;
            expect(Inner.prototype.componentDidMount).to.have.been.calledOnce;
            expect(Inner.prototype.render).to.have.been.calledTwice;

            expect(Inner.prototype.render.secondCall)
                .to.have.returned(sinon.match({
                    props: {
                        j: 2,
                        i: 2,
                        foo: 'bar'
                    }
                }));

            expect(getAttributes(scratch.firstElementChild)).to.eql({
                j: '2',
                i: '2',
                foo: 'bar'
            });

            expect(sortAttributes(scratch.innerHTML)).to.equal(sortAttributes('<div foo="bar" j="2" i="2">inner</div>'));

            doRender();

            expect(Inner.prototype.componentWillUnmount).not.to.have.been.called;
            expect(Inner.prototype.componentWillMount).to.have.been.calledOnce;
            expect(Inner.prototype.componentDidMount).to.have.been.calledOnce;
            expect(Inner.prototype.render).to.have.been.calledThrice;

            expect(Inner.prototype.render.thirdCall)
                .to.have.returned(sinon.match({
                    props: {
                        j: 3,
                        i: 3,
                        foo: 'bar'
                    }
                }));

            expect(getAttributes(scratch.firstElementChild)).to.eql({
                j: '3',
                i: '3',
                foo: 'bar'
            });


            alt = true;
            doRender();

            expect(Inner.prototype.componentWillUnmount).to.have.been.calledOnce;

            expect(scratch.innerHTML).to.equal('<div is-alt="true"></div>');

            alt = false;
            doRender();

            expect(sortAttributes(scratch.innerHTML)).to.equal(sortAttributes('<div foo="bar" j="4" i="5">inner</div>'));
        });

        it('should unmount children of high-order components without unmounting parent', () => {
            let outer;
            let inner2; // eslint-disable-line  no-unused-vars
            let counter = 0;

            class Outer extends MVR.Component {
                constructor(props, context) {
                    super(props, context);
                    outer = this;
                    this.state = {
                        child: this.props.child
                    };
                }
                componentWillMount() {}
                componentDidMount() {}
                componentWillUnmount() {
                }
                render() {
                    return MVR.createElement(this.state.child);
                }
            }

            sinon.spy(Outer.prototype, 'render');
            sinon.spy(Outer.prototype, 'componentDidMount');
            sinon.spy(Outer.prototype, 'componentWillMount');
            sinon.spy(Outer.prototype, 'componentWillUnmount');

            class Inner extends MVR.Component {
                componentWillUnmount() {}
                componentWillMount() {}
                componentDidMount() {}
                render() {
                    return MVR.createElement('span', {}, [`element ${++counter}`]);
                }
            }

            sinon.spy(Inner.prototype, 'render');
            sinon.spy(Inner.prototype, 'componentDidMount');
            sinon.spy(Inner.prototype, 'componentWillMount');
            sinon.spy(Inner.prototype, 'componentWillUnmount');

            class Inner2 extends MVR.Component {
                constructor(props, context) {
                    super(props, context);
                    inner2 = this;
                }
                componentWillUnmount() {}
                componentWillMount() {}
                componentDidMount() {}
                render() {
                    return MVR.createElement('span', {}, [`element ${++counter}`]);
                }
            }

            sinon.spy(Inner2.prototype, 'render');
            sinon.spy(Inner2.prototype, 'componentDidMount');
            sinon.spy(Inner2.prototype, 'componentWillMount');
            sinon.spy(Inner2.prototype, 'componentWillUnmount');

            MVRDom.render(MVR.createElement(Outer, { child: Inner }), scratch);

            // outer should only have been mounted once
            expect(Outer.prototype.componentWillMount, 'outer initial').to.have.been.calledOnce;
            expect(Outer.prototype.componentDidMount, 'outer initial').to.have.been.calledOnce;
            expect(Outer.prototype.componentWillUnmount, 'outer initial').not.to.have.been.called;

            // inner should only have been mounted once
            expect(Inner.prototype.componentWillMount, 'inner initial').to.have.been.calledOnce;
            expect(Inner.prototype.componentDidMount, 'inner initial').to.have.been.calledOnce;
            expect(Inner.prototype.componentWillUnmount, 'inner initial').not.to.have.been.called;

            outer.setState({ child: Inner2 });

            expect(Inner2.prototype.render).to.have.been.calledOnce;

            // outer should still only have been mounted once
            expect(Outer.prototype.componentWillMount, 'outer swap').to.have.been.calledOnce;
            expect(Outer.prototype.componentDidMount, 'outer swap').to.have.been.calledOnce;
            expect(Outer.prototype.componentWillUnmount, 'outer swap').not.to.have.been.called;

            // inner2 should only have been mounted once
            expect(Inner2.prototype.componentWillMount, 'inner2 swap').to.have.been.calledOnce;
            expect(Inner2.prototype.componentDidMount, 'inner2 swap').to.have.been.calledOnce;
            expect(Inner2.prototype.componentWillUnmount, 'inner2 swap').not.to.have.been.called;

            outer.setState({ child: Inner2 });

            expect(Inner2.prototype.render, 'inner2 update').to.have.been.calledTwice;
            expect(Inner2.prototype.componentWillMount, 'inner2 update').to.have.been.calledOnce;
            expect(Inner2.prototype.componentDidMount, 'inner2 update').to.have.been.calledOnce;
            expect(Inner2.prototype.componentWillUnmount, 'inner2 update').not.to.have.been.called;
        });
    });
});
