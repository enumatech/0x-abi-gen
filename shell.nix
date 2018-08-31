with (import <nixpkgs> {});

mkShell {
  buildInputs = let
    nodePackage = nodejs-8_x;
  in [
    nodePackage.passthru.python
    nodePackage
    libudev
    libusb
    yarn
  ];

  shellHook = ''
    export PATH="$PATH:"$(pwd)/node_modules/.bin
  '';
}
