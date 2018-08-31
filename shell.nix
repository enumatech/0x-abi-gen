with (import <nixpkgs> {});

mkShell {
  buildInputs = [
    nodejs-8_x.passthru.python
    nodejs-8_x
    yarn
  ];

  shellHook = ''
    export PATH="$PATH:"$(pwd)/node_modules/.bin
  '';
}
