module.exports = {
    "extends": "airbnb",
    "plugins": [
        "react",
        "jsx-a11y",
        "import"
    ],
    "globals": {
        document: true,
        window: true,
        describe: true,
        it: true,
        before: true,
        beforeEach: true,
        after: true,
        sinon: true,
        expect: true
    },
    "rules": {
        "react/jsx-no-bind": [0],
        "react/prop-types": [0],
        "react/no-multi-comp": [0],
        "react/prefer-stateless-function": [0],
        "react/style-prop-object": [0],
        indent: ["error", 4],
        "comma-dangle": ["error", {
            "arrays": "never",
            "objects": "never",
            "imports": "never",
            "exports": "never",
            "functions": "never"
        }],
        "max-len": [0],
        "no-param-reassign": [0],
        "no-console": [0],
        "no-underscore-dangle": [0],
        "no-else-return": [0],
        "new-cap": [0],
        "no-lonely-if": [0],
        "one-var": [0],
        "no-plusplus": [0]
    }
};
