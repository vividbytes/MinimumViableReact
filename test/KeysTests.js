import chai from 'chai';
import sinonChai from 'sinon-chai';
import MVR from '../src/part4/MVR';
import MVRDom from '../src/part4/MVRDom';

const expect = chai.expect;
chai.use(sinonChai);

describe('keys', () => {
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

    // See developit/preact-compat#21
    it('should remove orphaned keyed nodes', () => {
        MVRDom.render((
            MVR.createElement('div', {}, [
                MVR.createElement('div', {}, ['1']),
                MVR.createElement('li', { key: 'a' }, ['a']),
                MVR.createElement('li', { key: 'b' }, ['b'])
            ])
        ), scratch);

        MVRDom.render((
            MVR.createElement('div', {}, [
                MVR.createElement('div', {}, ['2']),
                MVR.createElement('li', { key: 'b' }, ['b']),
                MVR.createElement('li', { key: 'c' }, ['c'])
            ])
        ), scratch);

        expect(scratch.innerHTML).to.equal('<div><div>2</div><li>b</li><li>c</li></div>');
    });

    it('should remove keyed nodes', () => {
        class BusyIndicator extends MVR.Component {
            render() {
                const { children, busy } = this.props;
                return MVR.createElement('div', {
                    class: busy ? 'busy' : ''
                }, [
                    children && children.length ?
                        children :
                        MVR.createElement('div', {
                            class: 'busy-placeholder'
                        }),
                    MVR.createElement('div', {
                        class: 'indicator'
                    }, [
                        MVR.createElement('div', {}, ['indicator']),
                        MVR.createElement('div', {}, ['indicator']),
                        MVR.createElement('div', {}, ['indicator'])
                    ])
                ]);
            }
        }

        class App extends MVR.Component {
            componentDidMount() {
                setTimeout(() => this.setState({ opened: true, loading: true }), 10);
                setTimeout(() => this.setState({ opened: true, loading: false }), 20);
            }

            render() {
                const { opened, loading } = this.props;
                return (
                    MVR.createElement(BusyIndicator, {
                        id: 'app',
                        busy: loading
                    }, [
                        MVR.createElement('div', {}, [
                            'This div needs to be here for this to break'
                        ]),
                        opened && !loading && MVR.createElement('div', {}, [[]])
                    ])
                );
            }
        }


        MVRDom.render(MVR.createElement(App), scratch);
        MVRDom.render(MVR.createElement(App, {
            opened: true,
            loading: true
        }), scratch);
        MVRDom.render(MVR.createElement(App, {
            opened: true
        }), scratch);

        const html = String(scratch.firstChild.innerHTML).replace(/ class=""/g, '');
        expect(html).to.equal('<div>This div needs to be here for this to break</div><div></div><div class="indicator"><div>indicator</div><div>indicator</div><div>indicator</div></div>');
    });
});
