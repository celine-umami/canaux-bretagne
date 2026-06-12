import { escapeHtml } from "../utils/htmlUtils.js";
import Application from '../main.js';

/** @typedef {import('../types/Boat.js').Boat} Boat */
/** @typedef {import('../types/Channel.js').Channel} ChannelsType */


class HomePageManager {
  /** @type {Element | null} */
  channelListContainer;

  /** @type {Element | null} */
  bntBack;

  /** @type {Application} */
  app;

  /**
   * @param {Application} app - L'instance de l'application principale pour accéder aux données et méthodes globales
   */
  constructor(app) {
    this.app = app;
    this.channelListContainer = document.querySelector("#channel-list-container");

    // initalise le bouton de retour en arrière pour les sous section
    this.bntBack = document.querySelector("#home-page-bnt-back");

    this.bntBack.addEventListener("click", () => {
      this.hideBackButton();
      this.renderChannelList(window.app.channels.results);
    })

    // pour avoir un titre au chargement on affiche un titre qui sera écrasé ou pas par la suite
    this.setTitle("Cartographie des canaux");
  }

  /**
   * Groupe les canaux en sections et canaux individuels
   * @param {ChannelsType[]} channels 
   * @returns {Object} Objet avec sections et canaux
   */
  groupChannels(channels) {
    const sections = [];
    const morbihan = channels.filter(ch => ch.id === "Blavet" || ch.id === "CNB 18 à 111");
    
    if (morbihan.length > 0) {
      sections.push({
        name: "Morbihan",
        channels: morbihan,
        isSection: true
      });
    }

    const otherChannels = channels.filter(ch => ch.id !== "Blavet" && ch.id !== "CNB 18 à 111");
    
    return { sections, otherChannels };
  }

  /**
   * Obtient le titre d'affichage pour un canal
   * @param {ChannelsType} channel
   * @returns {string}
   */
  getChannelTitle(channel) {
    if (channel.id === "CNB 192 à 237") {
      return "Finistère";
    }
    return channel.secteur_appli || channel.voie_navigable;
  }

  /**
   * 
   * @param {ChannelsType[]} channels 
   */
  renderChannelList(channels) {
    this.hideBackButton();
    this.setTitle("Cartographie des canaux");

    // écrase un potentiel ancien contenu (ex: "Chargement...")
    this.channelListContainer.innerHTML = '';

    const { sections, otherChannels } = this.groupChannels(channels);

    // Afficher les sections d'abord
    sections.forEach(section => {
      const sectionCard = this.sectionCardHTML(section);
      
      sectionCard.addEventListener("click", () => {
        this.renderSectionChannels(section.channels, section.name);
      });

      this.channelListContainer.appendChild(sectionCard);
    });

    // Puis les canaux individuels triés alphabétiquement
    const sortedChannels = otherChannels.sort((a, b) => {
      const titleA = this.getChannelTitle(a);
      const titleB = this.getChannelTitle(b);
      return titleA.localeCompare(titleB);
    });

    sortedChannels.forEach(channel => {
      const channelCard = this.channelCardHTML(channel);

      // ajoute le listener pour allez sur la map
      const bntGoMap = channelCard.querySelector(".canal-card__button");

      bntGoMap.addEventListener("click", (e) => {
        window.uiManager.handleChangeCannel(channel, window.app.channels.results);
        window.app.handleChannelSelect(channel.id);
        window.navigationManager.navigate("map");
      });

      this.channelListContainer.appendChild(channelCard);
    });
  }

  /**
   * Affiche les canaux d'une section
   * @param {ChannelsType[]} channels 
   * @param {string} sectionName 
   */
  renderSectionChannels(channels, sectionName) {
    this.showBackButton();
    this.setTitle(sectionName);

    // écrase le contenu
    this.channelListContainer.innerHTML = '';

    // Trier les canaux de la section alphabétiquement
    const sortedChannels = channels.sort((a, b) => {
      const titleA = this.getChannelTitle(a);
      const titleB = this.getChannelTitle(b);
      return titleA.localeCompare(titleB);
    });

    sortedChannels.forEach(channel => {
      const channelCard = this.channelCardHTML(channel);

      // ajoute le listener pour allez sur la map
      const bntGoMap = channelCard.querySelector(".canal-card__button");

      bntGoMap.addEventListener("click", (e) => {
        window.uiManager.handleChangeCannel(channel, window.app.channels.results);
        window.app.handleChannelSelect(channel.id);
        window.navigationManager.navigate("map");
      });

      this.channelListContainer.appendChild(channelCard);
    });
  }

  /**
   * Crée une card pour une section
   * @param {Object} section 
   * @returns {HTMLDivElement}
   */
  sectionCardHTML(section) {
    const cardHTML = document.createElement("div");
    cardHTML.classList.add("canal-card");
    cardHTML.style.backgroundColor = "#8B7D6B";
    cardHTML.style.cursor = "pointer";

    // Calculer le nombre total de bateaux dans la section
    let totalBoats = { montant: 0, descendant: 0 };
    section.channels.forEach(channel => {
      const listBoatsForChannel = window.app.allBoats[channel.secteur_appli] || [];
      const boatsForThisChannel = listBoatsForChannel[channel.id] || [];
      
      boatsForThisChannel.forEach(boat => {
        if (boat.sens === "Montant") {
          totalBoats.montant += 1;
        } else if (boat.sens === "Descendant") {
          totalBoats.descendant += 1;
        }
      });
    });

    cardHTML.innerHTML = `
            <p class="canal-card__title">${escapeHtml(section.name)}</p>
            <div class="canal-card__footer">
                <div class="canal-card__status${(totalBoats.descendant === 0 && totalBoats.montant === 0) ? " canal-card__status--empty" : ""}">

                ${(totalBoats.descendant === 0 && totalBoats.montant === 0) ? `<p class="canal-card__status-text">Aucun bateau</p>` : `
                  ${totalBoats.descendant > 0 ? `
                    <div class="canal-card__metric">
                      <div class="canal-card__metric-badge">
                        <p class="canal-card__metric-badge-text" style="background-color: #AFCB56;">D</p>
                      </div>
                      <p class="canal-card__metric-text">${totalBoats.descendant} bateau${totalBoats.descendant > 1 ? "x" : ""}</p>
                    </div>` : ""}
                  ${totalBoats.montant > 0 ? `
                    <div class="canal-card__metric">
                      <div class="canal-card__metric-badge ">
                        <p class="canal-card__metric-badge-text" style="background-color: #F1B453;">M</p>
                      </div>
                      <p class="canal-card__metric-text">${totalBoats.montant} bateau${totalBoats.montant > 1 ? "x" : ""}</p>
                    </div>` : ""}
                  `}

                </div>
                <p class="canal-card__button" style="cursor: pointer;">Voir détails</p>
            </div>
        `;

    return cardHTML;
  }

  /**
   * @param {ChannelsType} channel
   * @returns {HTMLDivElement}
   */
  channelCardHTML(channel) {
    const cardHTML = document.createElement("div");
    cardHTML.classList.add("canal-card");
    cardHTML.style.backgroundColor = this.getColorCardChannel(channel.voie_navigable, channel.id);

    const title = this.getChannelTitle(channel);

    /** @type {Object.<string, Boat[]>} */
    const listBoatsForChannel = window.app.allBoats[channel.secteur_appli] || [];

    const boatsForThisSection = listBoatsForChannel[channel.id] || [];

    const { montant, descendant } = boatsForThisSection.reduce((acc, boat) => {
      if (boat.sens === "Montant") {
        acc.montant += 1;
      } else if (boat.sens === "Descendant") {
        acc.descendant += 1;
      }
      return acc;
    }, { montant: 0, descendant: 0 });

    cardHTML.innerHTML = `
            <p class="canal-card__title">${escapeHtml(title)}</p>
            <div class="canal-card__footer">
                <div class="canal-card__status${(descendant === 0 && montant === 0) ? " canal-card__status--empty" : ""}">

                ${(descendant === 0 && montant === 0) ? `<p class="canal-card__status-text">Aucun bateau</p>` : `
                  ${descendant > 0 ? `
                    <div class="canal-card__metric">
                      <div class="canal-card__metric-badge">
                        <p class="canal-card__metric-badge-text" style="background-color: #AFCB56;">D</p>
                      </div>
                      <p class="canal-card__metric-text">${descendant} bateau${descendant > 1 ? "x" : ""}</p>
                    </div>` : ""}
                  ${montant > 0 ? `
                    <div class="canal-card__metric">
                      <div class="canal-card__metric-badge ">
                        <p class="canal-card__metric-badge-text" style="background-color: #F1B453;">M</p>
                      </div>
                      <p class="canal-card__metric-text">${montant} bateau${montant > 1 ? "x" : ""}</p>
                    </div>` : ""}
                  `}


                </div>
                <button class="canal-card__button">Accéder</button>
            </div>
        `;

    // ajoute un lesener pour ouvrir la modal de détail des bateux
    if (boatsForThisSection.length > 0) {
      const divStatus = cardHTML.querySelector(".canal-card__status");

      divStatus.addEventListener("click", (e) => {
        e.stopPropagation();
        window.navigationManager.openModal(boatsForThisSection, "nombreBoats");
      });
    }

    // retourne la card
    return cardHTML;
  }

  /**
   * 
   * @param {string} voie_navigable 
   */
  getColorCardChannel(voie_navigable, channelId = null) {
    // Vérifier d'abord si c'est un CNB spécifique
    if (channelId === "CNB 18 à 111" || channelId === "CNB 192 à 237") {
      return "#A1B5DC"; // Bleu pour les CNB
    }

    switch (voie_navigable) {
      case "Blavet":
        return "#AFCB56";
      case "Canal d'Ille et Rance":
        return "#CC8CA8";
      case "Canal de Nantes à Brest":
        return "#A1B5DC";
      case "Vilaine":
        return "#CC8CA8";
      default:
        return "#AFCB56";
    }
  }

  /**
   * Change le titre de la page d'acceuil
   * @param {string} title - le titre a mettre sur la page d'acceuil
   * @returns rien
   */
  setTitle(title) {
    const titleElement = document.querySelector("#home-page-title");

    if (!titleElement) return;

    titleElement.textContent = title;
  }

  getBoatsForSectionChannel() { }

  /** Affiche le bouton retour au menu principal pour quitter les sous section */
  showBackButton() {
    this.bntBack.style.display = "flex";
  }

  /** Cache le bouton retour en arrère */
  hideBackButton() {
    this.bntBack.style.display = "none";
  }
}

export default HomePageManager;