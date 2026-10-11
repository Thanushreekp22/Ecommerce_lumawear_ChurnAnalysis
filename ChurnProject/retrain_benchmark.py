"""
retrain_benchmark.py

Restores the benchmark model artifacts (churn_pipeline.joblib, shap_explainer.joblib)
for artifacts/b139e4227328 from data/E Commerce Dataset.xlsx ("E Comm" sheet).

The .joblib files are excluded from git (see root .gitignore) but are required by
load_artifacts() and the backward-compatibility tests. The dataset hash is derived
from the sorted column names, so retraining on the same sheet reproduces the same
b139e4227328 artifact directory.
"""

import pandas as pd
from pathlib import Path

from utils.schema_inferrer import infer_schema
from backend.trainer import train_model, load_artifacts


def main():
    df = pd.read_excel("data/E Commerce Dataset.xlsx", sheet_name="E Comm")
    print(f"Loaded {len(df)} rows, {len(df.columns)} columns")

    schema = infer_schema(df, dataset_name="E-Commerce Churn Dataset")
    print(f"Dataset hash: {schema['dataset_hash']}")
    assert schema["dataset_hash"] == "b139e4227328", (
        f"Expected hash b139e4227328, got {schema['dataset_hash']}"
    )

    artifacts_dir = Path("artifacts") / schema["dataset_hash"]
    result = train_model(
        df=df,
        schema=schema,
        artifacts_dir=artifacts_dir,
        progress_callback=lambda step, pct: print(f"  [{pct:3d}%] {step}"),
    )
    print(f"AUC CV: {result['auc_cv']:.4f}")

    artifacts = load_artifacts(artifacts_dir)
    assert artifacts["pipeline"] is not None
    assert artifacts["metadata"]["n_features_raw"] == 18
    print(f"Verified: {artifacts_dir} now contains churn_pipeline.joblib")


if __name__ == "__main__":
    main()
