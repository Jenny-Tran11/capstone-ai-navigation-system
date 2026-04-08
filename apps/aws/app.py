import aws_cdk as cdk

from stacks.detection_stack import DetectionStack
from stacks.user_stack import UserApiStack


def main() -> None:
    app = cdk.App()

    env = cdk.Environment(
        account=app.node.try_get_context("account"),
        region=app.node.try_get_context("region"),
    )

    DetectionStack(app, "BlindNavDetectionStack", env=env)
    UserApiStack(app, "BlindNavUserApiStack", env=env)

    app.synth()


if __name__ == "__main__":
    main()

