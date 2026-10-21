# ParentCare360 — Testing Strategy & Verification Suite

## 1. Testing Philosophy

ParentCare360 implements a two-tier testing methodology:
1. **Deterministic Data Pipeline Edge-Case Harness (`tests/test_deterministic_dags.py`):** Uses synthetic frozen-clock fixtures to validate data pipeline edge scenarios without flaky network or timing dependencies.
2. **Mobile Core Features Test Suite (`tests/test_mobile_core_features.py`):** Verifies FastAPI REST endpoints and client workflow contracts (authentication, connection handshake, location sharing, prescriptions).

## 2. Running Test Suites

```bash
# Run all tests with verbose output
python3 -m pytest -v

# Run only deterministic pipeline tests
python3 -m pytest tests/test_deterministic_dags.py -v

# Run only mobile core feature tests
python3 -m pytest tests/test_mobile_core_features.py -v
```

## 3. Verified Edge-Case Test Scenarios

All five edge-case test suites achieve 100% pass rates:

| Test Identifier | Target Failure Condition | Injected Anomaly | Verification Criteria | Execution Time | Result |
| :--- | :--- | :--- | :--- | :---: | :---: |
| `test_edge_inactivity_watchdog` | Dead-man switch / Senior inactivity | Zero telemetry or heartbeats for >8 hours | Critical alert emitted with tier escalation | 0.04s | **PASS** |
| `test_edge_dedup_storm` | Alarm flooding storm | 40 rapid sensor triggers within 120 seconds | Exactly 1 alert recorded in `alerts`; 39 suppressed in `alert_dedup_cache` | 0.02s | **PASS** |
| `test_edge_poison_pill_quarantine` | Schema drift & corrupt rows | Non-ISO date (`INVALID-DATE`) & non-existent parent FK (`99999`) | 3 corrupt rows diverted to `quarantine_records` (DLQ); 2 clean rows saved | 0.03s | **PASS** |
| `test_edge_out_of_order_stream` | Out-of-order event streams | Earlier fall event arrives after routine vitals reading | Chronological watermarking preserves event ledger sequence | 0.02s | **PASS** |
| `test_edge_role_based_dispatch_granularity`| Patient health privacy boundary | Critical vs. Info alert dispatch evaluation | Caregiver PII masked; low-priority alerts filtered | 0.02s | **PASS** |

## 4. Empirical Test Output Log

```text
============================= test session starts ==============================
platform darwin -- Python 3.9.6, pytest-8.3.3, pluggy-1.5.0
rootdir: /Users/manthannayak/Desktop/Reference/DE/ParentCare360
plugins: anyio-4.12.0
collected 10 items

tests/test_deterministic_dags.py::test_edge_inactivity_watchdog PASSED   [ 10%]
tests/test_deterministic_dags.py::test_edge_dedup_storm PASSED           [ 20%]
tests/test_deterministic_dags.py::test_edge_poison_pill_quarantine PASSED [ 30%]
tests/test_deterministic_dags.py::test_edge_out_of_order_stream PASSED   [ 40%]
tests/test_deterministic_dags.py::test_edge_role_based_dispatch_granularity PASSED [ 50%]
tests/test_mobile_core_features.py::test_feature_1_independent_accounts_and_login PASSED [ 60%]
tests/test_mobile_core_features.py::test_feature_2_connection_request_and_acceptance PASSED [ 70%]
tests/test_mobile_core_features.py::test_feature_3_prescriptions_and_permissions PASSED [ 80%]
tests/test_mobile_core_features.py::test_feature_4_voice_messages_with_speech_to_text PASSED [ 90%]
tests/test_mobile_core_features.py::test_feature_5_location_sharing_and_help_requests PASSED [100%]

======================== 10 passed in 1.16s ========================
```
