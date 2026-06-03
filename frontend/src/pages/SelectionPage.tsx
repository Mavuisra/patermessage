import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatPrice, publicApi, type PlatformProfile } from "../api/client";
import logo from "../assets/logo.png";

export function SelectionPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PlatformProfile | null>(null);

  useEffect(() => {
    publicApi.getProfile().then(setProfile).catch(console.error);
  }, []);

  const premiumPrice = profile
    ? formatPrice(
        profile.premium_message_price.cents,
        profile.premium_message_price.currency || "USD"
      )
    : "$9.90";

  return (
    <div className="bp-app bp-select">
      <div className="bp-select__gradient" aria-hidden />
      <img src={logo} alt="" className="bp-select__watermark" aria-hidden />

      <header className="bp-select__header">
        <div className="bp-bp-logo">BP</div>
        <h1 className="bp-select__title">
          Comment souhaitez-vous contacter <strong>Black Pater</strong> ?
        </h1>
      </header>

      <div className="bp-option-list">
        <button type="button" className="bp-option" onClick={() => navigate("/message/free")}>
          <div className="bp-option__icon bp-option__icon--chat">💬</div>
          <div className="bp-option__body">
            <div className="bp-option__name">Message Gratuit</div>
            <p className="bp-option__desc">
              Votre message sera analysé par notre IA afin d&apos;identifier sa pertinence.
            </p>
            <div className="bp-option__price">Gratuit</div>
          </div>
          <span className="bp-option__chevron" aria-hidden>
            ›
          </span>
        </button>

        <button type="button" className="bp-option" onClick={() => navigate("/message/priority")}>
          <div className="bp-option__icon bp-option__icon--star">★</div>
          <div className="bp-option__body">
            <div className="bp-option__name">Message Prioritaire</div>
            <p className="bp-option__desc">
              Votre message sera placé en priorité et notifié immédiatement.
            </p>
            <div className="bp-option__price">{premiumPrice}</div>
          </div>
          <span className="bp-option__chevron" aria-hidden>
            ›
          </span>
        </button>

        <button type="button" className="bp-option" onClick={() => navigate("/call")}>
          <div className="bp-option__icon bp-option__icon--call">📞</div>
          <div className="bp-option__body">
            <div className="bp-option__name">Réserver un appel</div>
            <p className="bp-option__desc">
              Réservez un échange privé avec Black Pater.
            </p>
          </div>
          <span className="bp-option__chevron" aria-hidden>
            ›
          </span>
        </button>
      </div>

      <footer className="bp-select__footer">
        Sécurisé par chiffrement SSL
        <div className="bp-select__footer-lock">🔒 Paiement 100% sécurisé</div>
      </footer>

      <Link to="/login" className="bp-select__admin">
        Espace privé Black Pater
      </Link>
    </div>
  );
}
