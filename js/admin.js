/**
 * PROPATISS - Administration Dashboard Logic
 * Gestion des articles (Ajout, Modification, Suppression, Filtres, Export/Import)
 */

(function (window, $) {
   'use strict';

   // État de l'application Admin
   const state = {
      query: '',
      category: 'all',
      sortBy: 'newest',
      viewMode: 'table', // 'table' ou 'grid'
      currentEditId: null,
      currentDeleteId: null,
      activePresetImg: null
   };

   // Initialisation au chargement du DOM
   $(document).ready(function () {
      initEventListeners();
      renderDashboard();

      // Écouter les mises à jour externes du store
      window.addEventListener('propatiss:articles-changed', function () {
         renderDashboard();
      });
   });

   /**
    * Initialise tous les écouteurs d'événements
    */
   function initEventListeners() {
      // Recherche en direct
      $('#adminSearchInput').on('input', function () {
         state.query = $(this).val();
         renderArticlesList();
      });

      // Filtre catégorie
      $('#adminCategoryFilter').on('change', function () {
         state.category = $(this).val();
         renderArticlesList();
      });

      // Tri
      $('#adminSortSelect').on('change', function () {
         state.sortBy = $(this).val();
         renderArticlesList();
      });

      // Basculer la vue (Tableau / Grille)
      $('.btn-view-toggle').on('click', function () {
         $('.btn-view-toggle').removeClass('active');
         $(this).addClass('active');
         state.viewMode = $(this).data('view');
         renderArticlesList();
      });

      // Bouton Ajouter un Article
      $('#btnOpenAddModal').on('click', function () {
         openAddModal();
      });

      // Soumission du formulaire d'article
      $('#articleForm').on('submit', function (e) {
         e.preventDefault();
         handleFormSubmit();
      });

      // Mise à jour de la prévisualisation en direct
      $('#modalTitle, #modalCategory, #modalPrice, #modalOldPrice, #modalBadge, #modalBadgeColor, #modalDescription, #modalImage')
         .on('input change', updateLivePreview);

      // Téléversement d'image locale (Base64)
      $('#modalImageFile').on('change', function (e) {
         const file = e.target.files[0];
         if (file) {
            // Limite de taille recommandée (max 2Mo pour le stockage local)
            if (file.size > 2 * 1024 * 1024) {
               showToast('Attention', 'Image supérieure à 2 Mo, veuillez compresser l\'image.', 'danger');
            }
            const reader = new FileReader();
            reader.onload = function (evt) {
               const base64 = evt.target.result;
               $('#modalImage').val(base64);
               $('.preset-img-item').removeClass('active');
               updateLivePreview();
            };
            reader.readAsDataURL(file);
         }
      });

      // Sélection d'une image prédéfinie
      $(document).on('click', '.preset-img-item', function () {
         $('.preset-img-item').removeClass('active');
         $(this).addClass('active');
         const imgUrl = $(this).data('url');
         $('#modalImage').val(imgUrl);
         $('#modalImageFile').val('');
         updateLivePreview();
      });

      // Confirmation de suppression
      $('#btnConfirmDelete').on('click', function () {
         if (state.currentDeleteId) {
            const article = ProductStore.getArticleById(state.currentDeleteId);
            const success = ProductStore.deleteArticle(state.currentDeleteId);
            $('#deleteModal').modal('hide');
            if (success) {
               showToast('Suppression réussie', `L'article "${article ? article.title : ''}" a été supprimé.`, 'success');
               renderDashboard();
            } else {
               showToast('Erreur', 'Impossible de supprimer cet article.', 'danger');
            }
            state.currentDeleteId = null;
         }
      });

      // Réinitialiser au catalogue d'origine
      $('#btnResetCatalog').on('click', function () {
         if (confirm('Voulez-vous vraiment réinitialiser tout le catalogue aux articles d\'origine PROPATISS ? Vos modifications personnalisées seront écrasées.')) {
            ProductStore.resetToDefault();
            showToast('Catalogue réinitialisé', 'Les articles d\'origine ont été restaurés.', 'info');
            renderDashboard();
         }
      });

      // Exporter JSON
      $('#btnExportCatalog').on('click', function () {
         const json = ProductStore.exportJSON();
         const blob = new Blob([json], { type: 'application/json' });
         const url = URL.createObjectURL(blob);
         const a = document.createElement('a');
         a.href = url;
         a.download = `propatiss-catalogue-${new Date().toISOString().slice(0, 10)}.json`;
         document.body.appendChild(a);
         a.click();
         document.body.removeChild(a);
         URL.revokeObjectURL(url);
         showToast('Exportation terminée', 'Le fichier catalogue JSON a été téléchargé.', 'success');
      });

      // Importer JSON (Modal)
      $('#btnImportCatalog').on('click', function () {
         $('#importJsonModal').modal('show');
      });

      $('#btnConfirmImport').on('click', function () {
         const fileInput = document.getElementById('importFileInput');
         const textInput = $('#importJsonText').val().trim();

         if (fileInput.files.length > 0) {
            const reader = new FileReader();
            reader.onload = function (e) {
               processJsonImport(e.target.result);
            };
            reader.readAsText(fileInput.files[0]);
         } else if (textInput) {
            processJsonImport(textInput);
         } else {
            showToast('Erreur', 'Veuillez sélectionner un fichier ou coller du code JSON.', 'danger');
         }
      });
   }

   /**
    * Traite l'importation JSON
    */
   function processJsonImport(jsonString) {
      const res = ProductStore.importJSON(jsonString);
      if (res.success) {
         $('#importJsonModal').modal('hide');
         $('#importJsonText').val('');
         $('#importFileInput').val('');
         showToast('Importation réussie', `${res.count} articles ont été importés dans le catalogue !`, 'success');
         renderDashboard();
      } else {
         showToast('Échec de l\'importation', res.error, 'danger');
      }
   }

   /**
    * Rendu complet du tableau de bord
    */
   function renderDashboard() {
      updateKpis();
      renderArticlesList();
      renderPresetImages();
   }

   /**
    * Met à jour les compteurs KPI
    */
   function updateKpis() {
      const articles = ProductStore.getArticles();
      const total = articles.length;
      const inPromo = articles.filter(a => a.oldPrice && a.oldPrice > a.price).length;
      const outOfStock = articles.filter(a => !a.inStock).length;
      
      const categoriesSet = new Set(articles.map(a => a.category));
      const catCount = categoriesSet.size;

      animateCounter('#metricTotalArticles', total);
      animateCounter('#metricPromoArticles', inPromo);
      animateCounter('#metricOutOfStock', outOfStock);
      animateCounter('#metricCategories', catCount);
   }

   /**
    * Animation simple pour les nombres
    */
   function animateCounter(selector, targetVal) {
      $(selector).text(targetVal);
   }

   /**
    * Rendu de la liste des articles selon vue (table ou grille)
    */
   function renderArticlesList() {
      const articles = ProductStore.getArticles({
         query: state.query,
         category: state.category,
         sortBy: state.sortBy
      });

      $('#articlesCountBadge').text(`${articles.length} article(s)`);

      if (state.viewMode === 'table') {
         $('#adminTableView').show();
         $('#adminGridView').hide();
         renderTableView(articles);
      } else {
         $('#adminTableView').hide();
         $('#adminGridView').show();
         renderGridView(articles);
      }
   }

   /**
    * Rendu Vue Tableau
    */
   function renderTableView(articles) {
      const $tbody = $('#articlesTableBody');
      $tbody.empty();

      if (articles.length === 0) {
         $tbody.append(`
            <tr>
               <td colspan="7" class="text-center py-5">
                  <div class="admin-empty-state">
                     <i class="fa fa-folder-open-o admin-empty-icon"></i>
                     <h4>Aucun article trouvé</h4>
                     <p>Aucun article ne correspond à votre recherche ou filtre.</p>
                     <button class="btn btn-sm btn-outline-warning mt-2" onclick="$('#adminSearchInput').val(''); $('#adminCategoryFilter').val('all').trigger('change');">
                        Réinitialiser les filtres
                     </button>
                  </div>
               </td>
            </tr>
         `);
         return;
      }

      articles.forEach(article => {
         const hasPromo = article.oldPrice && article.oldPrice > article.price;
         const discountPercent = hasPromo ? Math.round(((article.oldPrice - article.price) / article.oldPrice) * 100) : 0;
         const badgeHtml = article.badge ? `<span class="badge-custom" style="background:${article.badgeColor || '#c99b4a'};">${escapeHtml(article.badge)}</span>` : '<span class="text-muted" style="font-size:12px;">—</span>';
         const stockHtml = article.inStock 
            ? `<span class="stock-indicator in-stock"><span class="stock-dot"></span> En stock</span>`
            : `<span class="stock-indicator out-of-stock"><span class="stock-dot"></span> Rupture</span>`;

         const waUrl = ProductStore.getWhatsAppLink(article);

         const row = `
            <tr data-id="${article.id}">
               <td style="width: 70px;">
                  <img src="${article.image || 'images/moule_silicone.jpg'}" alt="${escapeHtml(article.title)}" class="prod-thumb" onclick="previewImage('${article.image || 'images/moule_silicone.jpg'}', '${escapeHtml(article.title)}')" />
               </td>
               <td class="prod-title-cell">
                  <strong>${escapeHtml(article.title)}</strong>
                  <small class="text-muted"><i class="fa fa-tag"></i> Réf: ${article.id}</small>
                  <p class="text-muted mb-0 mt-1 text-truncate" style="max-width: 280px; font-size: 12px;">${escapeHtml(article.description || '')}</p>
               </td>
               <td>
                  <span class="category-tag ${article.category}">
                     ${escapeHtml(article.categoryLabel || article.category)}
                  </span>
               </td>
               <td>
                  <div>
                     ${hasPromo ? `<span class="price-old">${article.oldPrice} DT</span>` : ''}
                     <span class="price-main">${article.price} DT</span>
                     ${hasPromo ? `<span class="badge badge-success ml-1" style="font-size:10px;">-${discountPercent}%</span>` : ''}
                  </div>
               </td>
               <td>${badgeHtml}</td>
               <td>${stockHtml}</td>
               <td class="text-right">
                  <div class="table-actions">
                     <button class="btn-action btn-preview" title="Aperçu Client" onclick="window.AdminApp.quickPreview('${article.id}')">
                        <i class="fa fa-eye"></i>
                     </button>
                     <a href="${waUrl}" target="_blank" class="btn-action btn-wa" title="Tester le lien WhatsApp">
                        <i class="fa fa-whatsapp"></i>
                     </a>
                     <button class="btn-action btn-edit" title="Modifier l'article" onclick="window.AdminApp.editArticle('${article.id}')">
                        <i class="fa fa-pencil"></i>
                     </button>
                     <button class="btn-action btn-delete" title="Supprimer l'article" onclick="window.AdminApp.deletePrompt('${article.id}')">
                        <i class="fa fa-trash"></i>
                     </button>
                  </div>
               </td>
            </tr>
         `;
         $tbody.append(row);
      });
   }

   /**
    * Rendu Vue Grille (Cartes)
    */
   function renderGridView(articles) {
      const $grid = $('#articlesGridContainer');
      $grid.empty();

      if (articles.length === 0) {
         $grid.append(`
            <div class="col-12 text-center py-5">
               <div class="admin-empty-state">
                  <i class="fa fa-folder-open-o admin-empty-icon"></i>
                  <h4>Aucun article trouvé</h4>
                  <p>Aucun article ne correspond à vos critères de recherche.</p>
               </div>
            </div>
         `);
         return;
      }

      articles.forEach(article => {
         const hasPromo = article.oldPrice && article.oldPrice > article.price;
         const discountPercent = hasPromo ? Math.round(((article.oldPrice - article.price) / article.oldPrice) * 100) : 0;
         const badgeHtml = article.badge ? `<span class="admin-card-badge" style="background:${article.badgeColor || '#c99b4a'};">${escapeHtml(article.badge)}</span>` : '';
         const stockBadge = article.inStock 
            ? `<span class="stock-indicator in-stock" style="padding:2px 8px; font-size:11px;"><span class="stock-dot"></span> En stock</span>`
            : `<span class="stock-indicator out-of-stock" style="padding:2px 8px; font-size:11px;"><span class="stock-dot"></span> Rupture</span>`;

         const card = `
            <div class="col-lg-4 col-md-6 mb-4">
               <div class="admin-card-item">
                  <div class="admin-card-img-wrapper">
                     ${badgeHtml}
                     <img src="${article.image || 'images/moule_silicone.jpg'}" alt="${escapeHtml(article.title)}" />
                  </div>
                  <div class="admin-card-body">
                     <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="category-tag ${article.category}" style="font-size:10px;">
                           ${escapeHtml(article.categoryLabel || article.category)}
                        </span>
                        ${stockBadge}
                     </div>
                     <h4 class="admin-card-title">${escapeHtml(article.title)}</h4>
                     <p class="admin-card-desc">${escapeHtml(article.description || '')}</p>
                     
                     <div class="admin-card-footer">
                        <div>
                           ${hasPromo ? `<span class="price-old">${article.oldPrice} DT</span>` : ''}
                           <strong class="price-main">${article.price} DT</strong>
                           ${hasPromo ? `<span class="badge badge-success ml-1" style="font-size:10px;">-${discountPercent}%</span>` : ''}
                        </div>
                        <div class="table-actions">
                           <button class="btn-action btn-edit" title="Modifier" onclick="window.AdminApp.editArticle('${article.id}')">
                              <i class="fa fa-pencil"></i>
                           </button>
                           <button class="btn-action btn-delete" title="Supprimer" onclick="window.AdminApp.deletePrompt('${article.id}')">
                              <i class="fa fa-trash"></i>
                           </button>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         `;
         $grid.append(card);
      });
   }

   /**
    * Rendu des boutons d'images prédéfinies dans le modal
    */
   function renderPresetImages() {
      const presets = ProductStore.getPresetImages();
      const $container = $('#presetImagesContainer');
      $container.empty();

      presets.forEach(p => {
         $container.append(`
            <div class="preset-img-item" data-url="${p.url}" title="${p.label}">
               <img src="${p.url}" alt="${p.label}" />
            </div>
         `);
      });
   }

   /**
    * Ouvre le modal en mode "Ajouter"
    */
   function openAddModal() {
      state.currentEditId = null;
      $('#articleModalTitle').html('<i class="fa fa-plus-circle text-warning mr-2"></i> Ajouter un Nouvel Article');
      $('#btnSaveArticle').html('<i class="fa fa-check mr-2"></i> Enregistrer l\'article');
      
      // Réinitialisation du formulaire
      $('#articleForm')[0].reset();
      $('#articleIdHidden').val('');
      $('#modalCategory').val('silicone');
      $('#modalBadgeColor').val('#c99b4a');
      $('#modalInStock').prop('checked', true);
      $('#modalFeatured').prop('checked', false);
      $('#modalImage').val('images/moule_silicone.jpg');

      $('.preset-img-item').removeClass('active');
      $(`.preset-img-item[data-url="images/moule_silicone.jpg"]`).addClass('active');

      updateLivePreview();
      $('#articleModal').modal('show');
   }

   /**
    * Ouvre le modal en mode "Modifier"
    */
   function openEditModal(id) {
      const article = ProductStore.getArticleById(id);
      if (!article) {
         showToast('Erreur', 'Article introuvable.', 'danger');
         return;
      }

      state.currentEditId = id;
      $('#articleModalTitle').html(`<i class="fa fa-pencil text-warning mr-2"></i> Modifier l'Article <small style="font-size:13px; color:#c99b4a;">(#${id})</small>`);
      $('#btnSaveArticle').html('<i class="fa fa-save mr-2"></i> Sauvegarder les modifications');

      $('#articleIdHidden').val(article.id);
      $('#modalTitle').val(article.title);
      $('#modalCategory').val(article.category);
      $('#modalPrice').val(article.price);
      $('#modalOldPrice').val(article.oldPrice || '');
      $('#modalBadge').val(article.badge || '');
      $('#modalBadgeColor').val(article.badgeColor || '#c99b4a');
      $('#modalImage').val(article.image || '');
      $('#modalDescription').val(article.description || '');
      $('#modalInStock').prop('checked', article.inStock !== false);
      $('#modalFeatured').prop('checked', Boolean(article.featured));

      $('.preset-img-item').removeClass('active');
      $(`.preset-img-item[data-url="${article.image}"]`).addClass('active');

      updateLivePreview();
      $('#articleModal').modal('show');
   }

   /**
    * Mise à jour en temps réel de la carte de prévisualisation dans le modal
    */
   function updateLivePreview() {
      const title = $('#modalTitle').val().trim() || 'Titre de l\'article';
      const cat = $('#modalCategory').val();
      const catLabel = ProductStore.getCategoryLabel(cat);
      const price = $('#modalPrice').val() || '0';
      const oldPrice = $('#modalOldPrice').val();
      const badge = $('#modalBadge').val().trim();
      const badgeColor = $('#modalBadgeColor').val() || '#c99b4a';
      const image = $('#modalImage').val() || 'images/moule_silicone.jpg';
      const desc = $('#modalDescription').val().trim() || 'Description détaillée de l\'article pour vos clients...';

      $('#previewCardImg').attr('src', image);
      $('#previewCardTitle').text(title);
      $('#previewCardDesc').text(desc);
      $('#previewCardPrice').text(`${price} DT`);
      $('#previewCardCategory').text(catLabel);

      if (oldPrice && Number(oldPrice) > Number(price)) {
         $('#previewCardOldPrice').text(`${oldPrice} DT`).show();
      } else {
         $('#previewCardOldPrice').hide();
      }

      if (badge) {
         $('#previewCardBadge').text(badge).css('background', badgeColor).show();
      } else {
         $('#previewCardBadge').hide();
      }
   }

   /**
    * Traite la soumission du formulaire d'article (Ajout ou Modification)
    */
   function handleFormSubmit() {
      const title = $('#modalTitle').val().trim();
      const price = parseFloat($('#modalPrice').val());

      if (!title) {
         showToast('Champ requis', 'Veuillez saisir le titre de l\'article.', 'danger');
         $('#modalTitle').focus();
         return;
      }

      if (isNaN(price) || price < 0) {
         showToast('Prix invalide', 'Veuillez saisir un prix valide (ex: 18).', 'danger');
         $('#modalPrice').focus();
         return;
      }

      const formData = {
         title: title,
         category: $('#modalCategory').val(),
         price: price,
         oldPrice: $('#modalOldPrice').val() ? parseFloat($('#modalOldPrice').val()) : null,
         badge: $('#modalBadge').val().trim(),
         badgeColor: $('#modalBadgeColor').val(),
         image: $('#modalImage').val().trim() || 'images/moule_silicone.jpg',
         description: $('#modalDescription').val().trim(),
         inStock: $('#modalInStock').is(':checked'),
         featured: $('#modalFeatured').is(':checked')
      };

      if (state.currentEditId) {
         // Modification
         const updated = ProductStore.updateArticle(state.currentEditId, formData);
         if (updated) {
            showToast('Modifications enregistrées', `L'article "${updated.title}" a été mis à jour avec succès.`, 'success');
         }
      } else {
         // Ajout
         const added = ProductStore.addArticle(formData);
         if (added) {
            showToast('Article ajouté', `L'article "${added.title}" a été ajouté au catalogue !`, 'success');
         }
      }

      $('#articleModal').modal('hide');
      renderDashboard();
   }

   /**
    * Ouvre le modal de confirmation de suppression
    */
   function deletePrompt(id) {
      const article = ProductStore.getArticleById(id);
      if (!article) return;

      state.currentDeleteId = id;
      $('#deleteItemTitle').text(article.title);
      $('#deleteItemImg').attr('src', article.image || 'images/moule_silicone.jpg');
      $('#deleteItemPrice').text(`${article.price} DT`);
      $('#deleteModal').modal('show');
   }

   /**
    * Aperçu rapide client dans un modal dédié
    */
   function quickPreview(id) {
      const article = ProductStore.getArticleById(id);
      if (!article) return;

      const hasPromo = article.oldPrice && article.oldPrice > article.price;
      const discountPercent = hasPromo ? Math.round(((article.oldPrice - article.price) / article.oldPrice) * 100) : 0;
      const waUrl = ProductStore.getWhatsAppLink(article);

      $('#quickPreviewContent').html(`
         <div class="pp-prod-card h-100 text-left p-4" style="background:#1e1511; border:2px solid #c99b4a; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,0.6);">
            ${article.badge ? `<span class="badge mb-2 px-3 py-2 font-weight-bold" style="background:${article.badgeColor || '#c99b4a'}; color:#fff; border-radius:4px;">${escapeHtml(article.badge)}</span>` : ''}
            <img src="${article.image || 'images/moule_silicone.jpg'}" alt="${escapeHtml(article.title)}" style="height:240px; width:100%; object-fit:cover; border-radius:10px; margin-bottom:15px;" />
            <h3 style="color:#fff; font-family:'Playfair Display',serif; font-size:22px;">${escapeHtml(article.title)}</h3>
            <span class="category-tag ${article.category} mb-2">${escapeHtml(article.categoryLabel || article.category)}</span>
            <p style="color:#bdaea3; font-size:14px; margin-top:10px;">${escapeHtml(article.description || '')}</p>
            <div class="d-flex justify-content-between align-items-center mt-3 pt-3" style="border-top:1px dashed rgba(201,155,74,0.3);">
               <div>
                  ${hasPromo ? `<span style="text-decoration:line-through; color:#8c7d73; font-size:15px; margin-right:8px;">${article.oldPrice} DT</span>` : ''}
                  <strong style="color:#edd29b; font-size:26px;">${article.price} DT</strong>
                  ${hasPromo ? `<span class="badge badge-success ml-2">-${discountPercent}%</span>` : ''}
               </div>
               <a href="${waUrl}" target="_blank" class="btn btn-success rounded-pill px-4 py-2 font-weight-bold" style="background:#25D366; border:none;">
                  <i class="fa fa-whatsapp mr-1"></i> Commander
               </a>
            </div>
         </div>
      `);

      $('#quickPreviewModal').modal('show');
   }

   /**
    * Agrandir une image en plein écran
    */
   function previewImage(src, alt) {
      $('#imgPreviewModalSrc').attr('src', src);
      $('#imgPreviewModalTitle').text(alt);
      $('#imgPreviewModal').modal('show');
   }

   /**
    * Système de notification Toast élégant
    */
   function showToast(title, message, type) {
      type = type || 'info';
      const id = 'toast-' + Date.now();
      const icon = type === 'success' ? 'fa-check' : (type === 'danger' ? 'fa-trash' : 'fa-info-circle');

      const toastHtml = `
         <div id="${id}" class="toast-custom toast-${type}">
            <div class="toast-icon">
               <i class="fa ${icon}"></i>
            </div>
            <div>
               <div class="toast-title">${escapeHtml(title)}</div>
               <div class="toast-msg">${escapeHtml(message)}</div>
            </div>
         </div>
      `;

      $('#toastContainer').append(toastHtml);
      const $toast = $(`#${id}`);

      setTimeout(() => {
         $toast.addClass('show');
      }, 50);

      setTimeout(() => {
         $toast.removeClass('show');
         setTimeout(() => {
            $toast.remove();
         }, 400);
      }, 4000);
   }

   /**
    * Sécurisation des chaînes HTML contre les injections XSS
    */
   function escapeHtml(text) {
      if (!text) return '';
      return String(text)
         .replace(/&/g, '&amp;')
         .replace(/</g, '&lt;')
         .replace(/>/g, '&gt;')
         .replace(/"/g, '&quot;')
         .replace(/'/g, '&#039;');
   }

   // API publique accessible depuis le HTML
   window.AdminApp = {
      editArticle: openEditModal,
      deletePrompt: deletePrompt,
      quickPreview: quickPreview,
      previewImage: previewImage,
      showToast: showToast
   };

})(window, window.jQuery);
