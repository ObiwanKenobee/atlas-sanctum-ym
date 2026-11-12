# Atlas Forge — Benchmark I circuit build provenance

This branch builds one **source-generated** Benchmark I artifact: `invsqrt.kmb`.

## Generator source and attribution

The circuit builder is based on the Apache-2.0-licensed implementation:

- Repository: https://github.com/somfieao/kickmix-compiler
- Source revision: `b6999aa3e76a9a19fba35468d61236c65f1aa5cd`
- Source path: `results/vqcc_invsqrt/b0_a1/program.py`
- Source blob SHA-1: `4eb8cc2a7141c3abbbe9efcdc325e1770bb4522b`
- Repository license: Apache-2.0; accompanying `LICENSE` and `NOTICE` are retained here.

The builder implements leading-zero-pair normalization, a coefficient QROM, fixed-point cubic Taylor evaluation in Horner form, phase application, and measurement-based uncomputation. It is not the two-segment degree-7 numerical candidate from the Atlas Forge notebook.

## Pinned build dependency

Kickmix is fetched from the Apache-2.0 Google Qualtran repository using the exact Kickmix tree pin recorded by the source repository:

- https://github.com/quantumlib/Qualtran
- Kickmix tree: `638777fac4379bc62e2a1e4a52cf1a1753895d48`

The build workflow verifies each downloaded Git blob against the SHA-1 and byte size returned by the pinned tree object before installing it.

## Upstream reported measurement

The source repository's `results/vqcc_invsqrt/b0_a1/score.json` records:

- Official verifier status: PASS (the record describes 200,540,928 verified shots).
- Circuit SHA-256 (canonical KMB serialization): `38d90b452ef049e40061bfe5f3601385b1993b3bddb39cc3a0eab92adf62e02b`
- Qubits: 166.
- Mean Toffoli-like gates per shot: 3,141.
- Rotation count: 36.
- Reported score: 562,141.6364.
- Reported improvement over reference: 3.6941×.

These are upstream-reported results, not Atlas Forge's independent result. The workflow will regenerate the KMB file and fail if its SHA-256 differs from the reported circuit. It will also run the public competition verifier over the entire input domain with one shot per input, plus 64 shots per input on a 4,096-value prefix. The latter are bounded reproducibility checks, not a replacement for a 64-shot full-domain evaluation.

## Competition contract

The circuit must contain the one 22-qubit little-endian register `x`, implement the phase `exp(2*pi*i/sqrt(x))` for every integer `x = 1..3,133,452`, restore `x`, and return all scratch qubits to `|0>`. The phase-error limit is `2^-24 / sqrt(x)` turns.

## Scope and caveat

The emitted file is a real Kickmix circuit, not a renamed numerical table or placeholder. The workflow's independent tests and exact-byte comparison are the evidence for this build. Do not describe the new Atlas Forge degree-7 approximation as implemented by this circuit; that remains a separate algorithm-to-circuit research task.
