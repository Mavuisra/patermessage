from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0002_user_phone_occupation"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="subscription_active_until",
            field=models.DateTimeField(
                blank=True,
                help_text="Fin de l'abonnement premium visiteur",
                null=True,
            ),
        ),
    ]
