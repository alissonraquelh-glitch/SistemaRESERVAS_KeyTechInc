import { branchesData, contactInfo } from '../data/branchesData'
import { PhoneIcon, WhatsappIcon } from '../components/Icons'

export default function Contact() {
  return (
    <div className="page">
      <h1 className="page__title">Información General</h1>
      <p className="page__subtitle">Visítanos en cualquiera de nuestras sucursales.</p>

      <div className="branch-list">
        {branchesData.map((branch) => (
          <div className="branch-card" key={branch.id}>
            <img src={branch.image} alt={branch.name} />
            <div className="branch-card__body">
              <h2>{branch.name}</h2>
              <p>{branch.address}</p>
              <p className="branch-card__hours">{branch.hours}</p>
            </div>
          </div>
        ))}
      </div>

      <h2>Contáctanos</h2>
      <div className="cta-row">
        <a className="btn btn--outline" href={`tel:${contactInfo.phone}`}>
          <PhoneIcon /> {contactInfo.phone}
        </a>
        <a
          className="btn btn--outline"
          href={`https://wa.me/${contactInfo.whatsapp}`}
          target="_blank"
          rel="noreferrer"
        >
          <WhatsappIcon /> WhatsApp
        </a>
      </div>

      <div className="social-row">
        <a href={contactInfo.instagram} target="_blank" rel="noreferrer">
          Instagram
        </a>
        <a href={contactInfo.facebook} target="_blank" rel="noreferrer">
          Facebook
        </a>
      </div>
    </div>
  )
}
