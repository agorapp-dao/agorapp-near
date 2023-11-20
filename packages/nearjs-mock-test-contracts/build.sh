#!/bin/sh

echo ">> Building contracts"

near-sdk-js build src/EnvironmentContract.ts build/EnvironmentContract.wasm
near-sdk-js build src/LookupMapContract.ts build/LookupMapContract.wasm
near-sdk-js build src/MethodContract.ts build/MethodContract.wasm
