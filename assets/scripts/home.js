import { escapeHtml } from "./utils/htmlUtils.js";

/**
 * @typedef {Object} ChannelsType
 * @property {string} id
 * @property {string} voie_navigable
 * @property {string} [displayName]
 * @property {number} [id_section]
 * @property {number} [maxEcluse]
 * @property {number} [minEcluse]
 */

export class HomePageManager {
  /** @type {Element | null} */
  channelListContainer;

  constructor() {
    this.channelListContainer = document.querySelector("#channel-list-container");
  }

  /**
   * 
   * @param {ChannelsType[]} channels 
   */
  renderChannelList(channels) {
    // écrase un potentiel ancien contenu (ex: "Chargement...")
    this.channelListContainer.innerHTML = '';

    // tabluex qui stock les voie naviable pour pas avoir de doublon
    const voieNavigableChannelRendered = [];

    // partour tout les canaux pour les rendre sauf si la voir navigable a déjé été rendu
    channels.sort((a, b) => a.voie_navigable - b.voie_navigable).forEach(channel => {
      // si il a déjé été rendu on ne le rend pas a nouveux
      if (voieNavigableChannelRendered.includes(channel.voie_navigable)) {
        return;
      }

      const channelCard = this.channelCardHTML(channel);

      // ajoute le listener pour allez sur la map
      // crée temporairment le lisener pour allez sur la map
      const bntGoMap = channelCard.querySelector(".canal-card__button");

      bntGoMap.addEventListener("click", (e) => {
        window.uiManager.handleChangeCannel(channel.voie_navigable);
        window.app.handleChannelChange(channel.voie_navigable);
        window.navigationManager.navigate("map");
      })

      this.channelListContainer.appendChild(channelCard);
      voieNavigableChannelRendered.push(channel.voie_navigable);
    });
  }

  /**
   * @param {ChannelsType} channel
   * @returns {HTMLDivElement}
   */
  channelCardHTML(channel) {
    const cardHTML = document.createElement("div");
    cardHTML.classList.add("canal-card");
    cardHTML.style.backgroundColor = this.getColorCardChannel(channel.voie_navigable);

    cardHTML.innerHTML = `
            <p class="canal-card__title">${escapeHtml(channel.voie_navigable)}</p>
            <div class="canal-card__footer">
                <div class="canal-card__status">

                ${true ? `<p class="canal-card__status-text">Aucun bateau</p>` : `
                  <div class="canal-card__metric">
                    <div class="canal-card__metric-badge">
                      <p class="canal-card__metric-badge-text" style="background-color: #AFCB56;">D</p>
                    </div>
                    <p class="canal-card__metric-text">10 bateux</p>
                  </div>
                  <div class="canal-card__metric">
                    <div class="canal-card__metric-badge ">
                      <p class="canal-card__metric-badge-text" style="background-color: #F1B453;">M</p>
                    </div>
                    <p class="canal-card__metric-text">3 bateaux</p>
                  </div>
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
}