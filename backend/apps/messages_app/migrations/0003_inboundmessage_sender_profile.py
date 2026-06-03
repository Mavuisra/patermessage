from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("messages_app", "0002_inboundmessage_voice_note"),
    ]

    operations = [
        migrations.AddField(
            model_name="inboundmessage",
            name="sender_phone",
            field=models.CharField(blank=True, max_length=40),
        ),
        migrations.AddField(
            model_name="inboundmessage",
            name="sender_occupation",
            field=models.CharField(blank=True, max_length=200),
        ),
    ]
