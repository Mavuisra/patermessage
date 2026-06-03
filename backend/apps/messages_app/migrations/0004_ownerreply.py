from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("messages_app", "0003_inboundmessage_sender_profile"),
    ]

    operations = [
        migrations.CreateModel(
            name="OwnerReply",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("body", models.TextField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "message",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="replies",
                        to="messages_app.inboundmessage",
                    ),
                ),
            ],
            options={
                "ordering": ["created_at"],
            },
        ),
    ]
