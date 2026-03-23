import aws_cdk as cdk

from stacks.detection_stack import DetectionStack


def main() -> None:
    app = cdk.App()

    DetectionStack(
        app,
        "BlindNavDetectionStack",
        env=cdk.Environment(
            account=app.node.try_get_context("account"),
            region=app.node.try_get_context("region"),
        ),
    )

    app.synth()


if __name__ == "__main__":
    main()

