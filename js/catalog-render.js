/**
 * PROPATISS - Affichage des articles de l'admin sur les pages du site
 *
 * Utilisation : sur une page, donner à la grille de produits
 *    id="adminGrid"  data-category="<catégorie>"  [data-layout="pack"]
 * Les articles ajoutés depuis admin.html pour cette catégorie sont alors
 * ajoutés à la suite des cartes déjà présentes dans la page.
 *
 * Catégories : silicone | cakedesign | chocolat | boulangerie | combos
 * Prérequis  : jQuery + js/products-data.js chargés avant ce fichier.
 */
(function (window, $) {
   'use strict';

   var STORAGE_KEY = 'propatiss_articles_v1';

   function esc(text) {
      if (text === null || text === undefined) return '';
      return String(text)
         .replace(/&/g, '&amp;')
         .replace(/</g, '&lt;')
         .replace(/>/g, '&gt;')
         .replace(/"/g, '&quot;')
         .replace(/'/g, '&#039;');
   }

   function promoInfo(a) {
      var has = a.oldPrice && a.oldPrice > a.price;
      return {
         has: has,
         percent: has ? Math.round(((a.oldPrice - a.price) / a.oldPrice) * 100) : 0
      };
   }

   /* Carte "grille" (Chocolaterie, Pâte à Sucre) - même design que les cartes existantes */
   function gridCard(a) {
      var p = promoInfo(a);
      var badge = a.badge
         ? '<span class="pp-prod-badge align-self-start" style="background:' + esc(a.badgeColor || '#ec4c8a') + ';">' + esc(a.badge) + '</span>'
         : '';
      var action = a.inStock
         ? '<a href="' + esc(ProductStore.getWhatsAppLink(a)) + '" target="_blank" rel="noopener" class="btn btn-sm btn-success rounded-pill px-3" style="background:#25D366; border:none;">' +
              '<i class="fa fa-whatsapp"></i> Commander</a>'
         : '<span class="badge badge-secondary px-3 py-2">Rupture de stock</span>';

      return '' +
         '<div class="col-lg-4 col-md-6 mb-4" data-admin-item="' + esc(a.id) + '">' +
            '<div class="pp-prod-card h-100 d-flex flex-column text-left p-4">' +
               badge +
               '<img src="' + esc(a.image || 'images/moule_silicone.jpg') + '" alt="' + esc(a.title) + '" style="height:210px; width:100%; object-fit:cover; border-radius:12px; margin-bottom:15px;" />' +
               '<h4 style="color:#3d1f2e; font-family:\'Playfair Display\',serif;">' + esc(a.title) + '</h4>' +
               '<p style="color:#8a6478; font-size:14px; flex-grow:1;">' + esc(a.description) + '</p>' +
               '<div class="d-flex justify-content-between align-items-center mt-3 pt-3" style="border-top:1px dashed rgba(236,76,138,0.3);">' +
                  '<div>' +
                     (p.has ? '<span style="text-decoration:line-through; color:#b08fa0; font-size:13px; margin-right:5px;">' + esc(a.oldPrice) + ' DT</span>' : '') +
                     '<strong style="color:#d6336c; font-size:22px;">' + esc(a.price) + ' DT</strong>' +
                     (p.has ? '<span class="badge badge-success ml-1" style="font-size:10px;">-' + p.percent + '%</span>' : '') +
                  '</div>' +
                  action +
               '</div>' +
            '</div>' +
         '</div>';
   }

   /* Carte "pack" (Packs Éco) - même design que les packs existants */
   function packCard(a) {
      var p = promoInfo(a);
      var action = a.inStock
         ? '<a href="' + esc(ProductStore.getWhatsAppLink(a)) + '" target="_blank" rel="noopener" class="pp-pack-order">' +
              '<i class="fa fa-whatsapp mr-1"></i> Commander</a>'
         : '<span class="badge badge-secondary px-3 py-2">Rupture de stock</span>';

      return '' +
         '<div class="col-lg-3 col-md-6 mb-4" data-admin-item="' + esc(a.id) + '">' +
            '<div class="pp-pack-card p-4 d-flex flex-column align-items-center text-center h-100">' +
               '<span class="badge badge-danger p-2 mb-2 d-inline-block font-weight-bold" style="background:' + esc(a.badgeColor || '#e11d48') + ';">' + esc(a.badge || 'PACK ÉCONOMIQUE') + '</span>' +
               '<div class="pp-pack-icon pp-pack-photo"><img src="' + esc(a.image || 'images/moule_silicone.jpg') + '" alt="" /></div>' +
               '<h4>' + esc(a.title) + '</h4>' +
               '<p class="flex-grow-1">' + esc(a.description) + '</p>' +
               '<div class="d-flex align-items-center justify-content-center mb-3">' +
                  (p.has ? '<span style="text-decoration:line-through; color:#b08fa0; font-size:14px; margin-right:8px;">' + esc(a.oldPrice) + ' DT</span>' : '') +
                  '<strong style="color:#ec4c8a; font-size:23px;">' + esc(a.price) + ' DT</strong>' +
                  (p.has ? '<span class="badge badge-success ml-2 px-2 py-1">-' + p.percent + '%</span>' : '') +
               '</div>' +
               action +
            '</div>' +
         '</div>';
   }

   function render() {
      var $grid = $('#adminGrid');
      if (!$grid.length || !window.ProductStore) return;

      var category = $grid.data('category');
      var build = $grid.data('layout') === 'pack' ? packCard : gridCard;

      // On retire d'abord les cartes injectées précédemment (mise à jour à chaud)
      $grid.find('[data-admin-item]').remove();

      ProductStore.getArticles({ category: category, sortBy: 'newest' })
         // Les articles d'origine sont déjà écrits en dur dans la page : on évite les doublons
         .filter(function (a) { return !ProductStore.isSeedArticle(a.id); })
         .forEach(function (a) { $grid.append(build(a)); });
   }

   $(render);

   // Même onglet (ex. modification depuis l'admin puis retour à la page)
   window.addEventListener('propatiss:articles-changed', render);
   // Autre onglet : l'admin ouvert dans un onglet, la page publique dans un autre
   window.addEventListener('storage', function (e) {
      if (!e.key || e.key === STORAGE_KEY) render();
   });

   window.renderAdminArticles = render;
})(window, window.jQuery);
