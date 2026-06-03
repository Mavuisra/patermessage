from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("messages_app", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="inboundmessage",
            name="voice_note",
            field=models.FileField(blank=True, null=True, upload_to="voice/%Y/%m/"),
        ),
    ]
