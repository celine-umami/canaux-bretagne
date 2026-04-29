import { escapeHtml } from "./utils/htmlUtils.js";

/** @typedef {import('./types/Boat').Boat} Boat */
/** @typedef {import('./types/Channel').Channel} ChannelsType */


export class HomePageManager {
  /** @type {Element | null} */
  channelListContainer;
  bntBack;

  constructor() {
    this.channelListContainer = document.querySelector("#channel-list-container");

    // initalise le bouton de retour en arrière pour les sous section
    this.bntBack = document.querySelector("#home-page-bnt-back");

    this.bntBack.addEventListener("click", () => {
      this.bntBack.style.display = "none";
      this.renderChannelList(window.app.channels.results);
    })
  }

  /**
   * 
   * @param {ChannelsType[]} channels 
   * @param {boolean} isSubSection - pour que ca traite les sous section ou pas
   */
  renderChannelList(channels, isSubSection = false) {
    this.setTitle("Cartographie des canaux");

    // écrase un potentiel ancien contenu (ex: "Chargement...")
    this.channelListContainer.innerHTML = '';

    // tabluex qui stock les voie naviable pour pas avoir de doublon
    const voieNavigableChannelRendered = [];

    // partour tout les canaux pour les rendre sauf si la voir navigable a déjé été rendu
    channels.sort((a, b) => a.voie_navigable - b.voie_navigable).forEach(channel => {
      // si il a déjé été rendu on ne le rend pas a nouveux
      if (voieNavigableChannelRendered.includes(channel.voie_navigable) && !isSubSection) {
        return;
      }

      const channelCard = this.channelCardHTML(channel, isSubSection);

      // ajoute le listener pour allez sur la map
      // crée temporairment le lisener pour allez sur la map
      const bntGoMap = channelCard.querySelector(".canal-card__button");

      bntGoMap.addEventListener("click", (e) => {
        // si il a pas de sous section ou que c'est déja une sous section on va directement sur la map
        if (channel.id_section === undefined || isSubSection) {
          window.uiManager.handleChangeCannel(isSubSection ? channel.id : channel.voie_navigable);
          window.app.handleChannelChange(isSubSection ? channel.id : channel.voie_navigable);
          window.navigationManager.navigate("map");
          return;
        }
        // sion on change les canaux de la map pour afficher les sous section
        // en appelant récursivement la fonction de rendu de la liste
        this.renderChannelList(channels.filter(c => c.voie_navigable === channel.voie_navigable), true);
        this.setTitle(channel.voie_navigable);
        // affiche le bouton de retour en arrière
        this.bntBack.style.display = "flex";
      })

      this.channelListContainer.appendChild(channelCard);
      voieNavigableChannelRendered.push(channel.voie_navigable);
    });
  }

  /**
   * @param {ChannelsType} channel
   * @param {boolean} isSubSection - pour que ca traite les sous section ou pas
   * @returns {HTMLDivElement}
   */
  channelCardHTML(channel, isSubSection = false) {
    const cardHTML = document.createElement("div");
    cardHTML.classList.add("canal-card");
    cardHTML.style.backgroundColor = this.getColorCardChannel(channel.voie_navigable);

    const title = isSubSection ? this.generateNameSoubSection(channel) : channel.voie_navigable;

    /** @type {Boat[]} */
    const listBoatsForChannel = window.app.allBoats[channel.voie_navigable] || [];

    const boatsForThisSection = listBoatsForChannel

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
                <div class="canal-card__status">

                ${(descendant === 0 && montant === 0) ? `<p class="canal-card__status-text">Aucun bateau</p>` : `
                  ${descendant > 0 ? `
                    <div class="canal-card__metric">
                      <div class="canal-card__metric-badge">
                        <p class="canal-card__metric-badge-text" style="background-color: #AFCB56;">D</p>
                      </div>
                      <p class="canal-card__metric-text">${descendant} bateux</p>
                    </div>` : ""}
                  ${montant > 0 ? `
                    <div class="canal-card__metric">
                      <div class="canal-card__metric-badge ">
                        <p class="canal-card__metric-badge-text" style="background-color: #F1B453;">M</p>
                      </div>
                      <p class="canal-card__metric-text">${montant} bateaux</p>
                    </div>` : ""}
                  `}


                </div>
                <button class="canal-card__button">Accéder</button>
            </div>
        `;

    return cardHTML;

    // return `
    // <div class="canal-card" style="background-color: #AFCB56;">
    //     <p class="canal-card__title">Blavet</p>
    //     <div class="canal-card__footer">
    //         <div class="canal-card__status">
    //             <p class="canal-card__status-text">Aucun bateau</p>
    //         </div>
    //         <button class="canal-card__button">Accéder</button>
    //     </div>
    // </div>

    // <div class="canal-card" style="background-color: #A1B5DC;">
    //     <p class="canal-card__title">Canal Ille et Rance</p>
    //     <div class="canal-card__footer">
    //         <div class="canal-card__status">
    //             <div class="canal-card__metric">
    //                 <div class="canal-card__metric-badge">
    //                     <p class="canal-card__metric-badge-text" style="background-color: #AFCB56;">D</p>
    //                 </div>
    //                 <p class="canal-card__metric-text">10 bateux</p>
    //             </div>
    //             <div class="canal-card__metric">
    //                 <div class="canal-card__metric-badge ">
    //                     <p class="canal-card__metric-badge-text" style="background-color: #F1B453;">M</p>
    //                 </div>
    //                 <p class="canal-card__metric-text">3 bateaux</p>
    //             </div>
    //         </div>
    //         <button class="canal-card__button">Accéder</button>
    //     </div>
    // </div>
    // `
  }

  /**
   * 
   * @param {string} voie_navigable 
   */
  getColorCardChannel(voie_navigable) {
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
   * Génère le titre de la card pour une sous section
   * @param {ChannelsType} channel
   */
  generateNameSoubSection(channel) {
    return `${channel.voie_navigable} entre n°${channel.minEcluse} et n°${channel.maxEcluse}`;
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
}