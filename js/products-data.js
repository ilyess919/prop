/**
 * PROPATISS - Gestionnaire Central des Articles (Produits)
 * Stockage LocalStorage et gestion CRUD (Ajout, Modification, Suppression)
 */

(function (window) {
   'use strict';

   const STORAGE_KEY = 'propatiss_articles_v1';

   // Articles par défaut du catalogue PROPATISS
   const DEFAULT_ARTICLES = [
      {
         id: 'art-1',
         title: 'Moule Silicone Entremets Dôme & Nuage',
         category: 'silicone',
         categoryLabel: 'Moules Silicone',
         price: 18,
         oldPrice: null,
         badge: 'MOULE SILICONE',
         badgeColor: '#ec4c8a',
         image: 'images/moule_silicone.jpg',
         description: 'Silicone platinium antiadhésif haute précision. Idéal pour glaçage miroir et textures velours.',
         inStock: true,
         featured: true,
         createdAt: '2026-01-10T10:00:00.000Z'
      },
      {
         id: 'art-2',
         title: 'Moule Silicone Relief & Décors Perlés',
         category: 'silicone',
         categoryLabel: 'Moules Silicone',
         price: 5,
         oldPrice: 22,
         badge: 'PACK PROMO',
         badgeColor: '#f472b6',
         image: 'images/moule_silicone.jpg',
         description: 'Vu sur nos vidéos en magasin ! Empreintes pour bordures de gâteaux féériques et wedding cakes.',
         inStock: true,
         featured: true,
         createdAt: '2026-01-11T11:00:00.000Z'
      },
      {
         id: 'art-3',
         title: 'Set Stylets Boules Modelage Pâte à Sucre',
         category: 'cakedesign',
         categoryLabel: 'Pâte à Sucre & Cake Design',
         price: 6,
         oldPrice: 12,
         badge: 'CAKE DESIGN',
         badgeColor: '#a21caf',
         image: 'images/pate_sucre_outils.jpg',
         description: 'Kit complet 8 embouts boules en inox et manches ergonomiques pour affiner les pétales et modeler vos figurines.',
         inStock: true,
         featured: true,
         createdAt: '2026-01-12T12:00:00.000Z'
      },
      {
         id: 'art-4',
         title: 'Rouleau Relief Pâte à Sucre (Empreinte 3D)',
         category: 'cakedesign',
         categoryLabel: 'Pâte à Sucre & Cake Design',
         price: 3,
         oldPrice: 10,
         badge: 'CAKE DESIGN',
         badgeColor: '#a21caf',
         image: 'images/pate_sucre_outils.jpg',
         description: 'Gravure profonde pour imprimer des motifs floraux, dentelles et volutes sur pâte à sucre et pâte d\'amande.',
         inStock: true,
         featured: true,
         createdAt: '2026-01-13T13:00:00.000Z'
      },
      {
         id: 'art-5',
         title: 'Moule Polycarbonate 24 Bonbons Sphères',
         category: 'chocolat',
         categoryLabel: 'Chocolaterie',
         price: 28,
         oldPrice: null,
         badge: 'CHOCOLATERIE',
         badgeColor: '#9d174d',
         image: 'images/chocolaterie_moules.jpg',
         description: 'Polycarbonate rigide professionnel pour coques de chocolat ultra-brillantes et claquantes. Démoulage facile.',
         inStock: true,
         featured: true,
         createdAt: '2026-01-14T14:00:00.000Z'
      },
      {
         id: 'art-6',
         title: 'Toile Silicone Microperforée Silpat 40x30',
         category: 'boulangerie',
         categoryLabel: 'Boulangerie & Cuisson',
         price: 22,
         oldPrice: 35,
         badge: 'BOULANGERIE',
         badgeColor: '#db2777',
         image: 'images/boulangerie_materiel.jpg',
         description: 'Cuisson aérée et croustillante parfaite pour éclairs, choux, macarons, sablés et fonds de tartes.',
         inStock: true,
         featured: false,
         createdAt: '2026-01-15T15:00:00.000Z'
      },
      {
         id: 'art-7',
         title: 'Rouleau Relief Motifs Spéciaux Wedding Cake',
         category: 'cakedesign',
         categoryLabel: 'Pâte à Sucre & Cake Design',
         price: 5,
         oldPrice: 12,
         badge: 'ÉDITION SPÉCIALE',
         badgeColor: '#e11d48',
         image: 'images/pate_sucre_outils.jpg',
         description: 'Finitions 3D parfaites pour habiller les gâteaux d\'anniversaire et pièces montées raffinées.',
         inStock: true,
         featured: false,
         createdAt: '2026-01-16T16:00:00.000Z'
      },
      {
         id: 'art-8',
         title: 'Thermomètre Sonde Électronique Digitale',
         category: 'chocolat',
         categoryLabel: 'Chocolaterie',
         price: 19,
         oldPrice: 26,
         badge: 'OUTILLAGE PRO',
         badgeColor: '#9d174d',
         image: 'images/choclate_img.jpg',
         description: 'Indispensable pour le tempérage du chocolat de couverture et le contrôle de cuisson du sirop et caramel.',
         inStock: true,
         featured: false,
         createdAt: '2026-01-17T17:00:00.000Z'
      }
   ];

   const ProductStore = {
      /**
       * Initialise la base de données locale
       */
      init: function () {
         const stored = localStorage.getItem(STORAGE_KEY);
         if (!stored) {
            this.setArticles(DEFAULT_ARTICLES);
         }
         return this.getArticles();
      },

      /**
       * Récupère tous les articles du stockage
       */
      getArticles: function (options) {
         try {
            const data = localStorage.getItem(STORAGE_KEY);
            let articles = data ? JSON.parse(data) : [...DEFAULT_ARTICLES];

            if (!options) return articles;

            // Filtre par catégorie
            if (options.category && options.category !== 'all') {
               articles = articles.filter(a => a.category === options.category);
            }

            // Recherche textuelle
            if (options.query && options.query.trim() !== '') {
               const q = options.query.toLowerCase().trim();
               articles = articles.filter(a =>
                  (a.title && a.title.toLowerCase().includes(q)) ||
                  (a.description && a.description.toLowerCase().includes(q)) ||
                  (a.badge && a.badge.toLowerCase().includes(q)) ||
                  (a.categoryLabel && a.categoryLabel.toLowerCase().includes(q))
               );
            }

            // Filtre par stock
            if (options.inStockOnly) {
               articles = articles.filter(a => a.inStock);
            }

            // Tri
            if (options.sortBy) {
               switch (options.sortBy) {
                  case 'price-asc':
                     articles.sort((a, b) => Number(a.price) - Number(b.price));
                     break;
                  case 'price-desc':
                     articles.sort((a, b) => Number(b.price) - Number(a.price));
                     break;
                  case 'name-asc':
                     articles.sort((a, b) => a.title.localeCompare(b.title));
                     break;
                  case 'name-desc':
                     articles.sort((a, b) => b.title.localeCompare(a.title));
                     break;
                  case 'newest':
                  default:
                     articles.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
                     break;
               }
            }

            return articles;
         } catch (e) {
            console.error('Erreur lecture ProductStore:', e);
            return [...DEFAULT_ARTICLES];
         }
      },

      /**
       * Récupère un article par son ID
       */
      getArticleById: function (id) {
         const list = this.getArticles();
         return list.find(a => a.id === id) || null;
      },

      /**
       * Indique si l'article fait partie du catalogue d'origine (déjà présent
       * en dur dans les pages HTML). Les autres ont été ajoutés via l'admin.
       */
      isSeedArticle: function (id) {
         return DEFAULT_ARTICLES.some(a => a.id === id);
      },

      /**
       * Écrit la liste complète dans localStorage
       */
      setArticles: function (articles) {
         try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
            window.dispatchEvent(new CustomEvent('propatiss:articles-changed', { detail: { articles } }));
            return true;
         } catch (e) {
            console.error('Erreur écriture ProductStore:', e);
            return false;
         }
      },

      /**
       * Ajoute un nouvel article
       */
      addArticle: function (data) {
         const articles = this.getArticles();
         const newId = 'art-' + Date.now();

         const newArticle = {
            id: newId,
            title: (data.title || 'Nouvel Article').trim(),
            category: data.category || 'silicone',
            categoryLabel: this.getCategoryLabel(data.category),
            price: Number(data.price) || 0,
            oldPrice: data.oldPrice ? Number(data.oldPrice) : null,
            badge: (data.badge || '').trim(),
            badgeColor: data.badgeColor || '#ec4c8a',
            image: data.image || 'images/moule_silicone.jpg',
            description: (data.description || '').trim(),
            inStock: data.inStock !== false,
            featured: Boolean(data.featured),
            createdAt: new Date().toISOString()
         };

         articles.unshift(newArticle);
         this.setArticles(articles);
         return newArticle;
      },

      /**
       * Met à jour un article existant
       */
      updateArticle: function (id, data) {
         const articles = this.getArticles();
         const index = articles.findIndex(a => a.id === id);
         if (index === -1) return null;

         const current = articles[index];
         const updated = {
            ...current,
            title: data.title !== undefined ? data.title.trim() : current.title,
            category: data.category !== undefined ? data.category : current.category,
            categoryLabel: data.category !== undefined ? this.getCategoryLabel(data.category) : current.categoryLabel,
            price: data.price !== undefined ? Number(data.price) : current.price,
            oldPrice: data.oldPrice !== undefined && data.oldPrice !== '' && data.oldPrice !== null ? Number(data.oldPrice) : null,
            badge: data.badge !== undefined ? data.badge.trim() : current.badge,
            badgeColor: data.badgeColor !== undefined ? data.badgeColor : current.badgeColor,
            image: data.image !== undefined ? data.image : current.image,
            description: data.description !== undefined ? data.description.trim() : current.description,
            inStock: data.inStock !== undefined ? Boolean(data.inStock) : current.inStock,
            featured: data.featured !== undefined ? Boolean(data.featured) : current.featured,
            updatedAt: new Date().toISOString()
         };

         articles[index] = updated;
         this.setArticles(articles);
         return updated;
      },

      /**
       * Supprime un article par son ID
       */
      deleteArticle: function (id) {
         const articles = this.getArticles();
         const initialLen = articles.length;
         const filtered = articles.filter(a => a.id !== id);
         if (filtered.length !== initialLen) {
            this.setArticles(filtered);
            return true;
         }
         return false;
      },

      /**
       * Réinitialise les articles au catalogue d'origine
       */
      resetToDefault: function () {
         this.setArticles(DEFAULT_ARTICLES);
         return DEFAULT_ARTICLES;
      },

      /**
       * Exporte le catalogue sous forme de chaîne JSON téléchargeable
       */
      exportJSON: function () {
         const articles = this.getArticles();
         return JSON.stringify(articles, null, 2);
      },

      /**
       * Importe un catalogue depuis une chaîne JSON
       */
      importJSON: function (jsonString) {
         try {
            const parsed = JSON.parse(jsonString);
            if (Array.isArray(parsed) && parsed.length > 0) {
               // Vérifier qu'au moins les champs de base sont présents
               const validated = parsed.map((item, idx) => ({
                  id: item.id || ('art-' + Date.now() + '-' + idx),
                  title: item.title || 'Article sans nom',
                  category: item.category || 'silicone',
                  categoryLabel: this.getCategoryLabel(item.category),
                  price: Number(item.price) || 0,
                  oldPrice: item.oldPrice ? Number(item.oldPrice) : null,
                  badge: item.badge || '',
                  badgeColor: item.badgeColor || '#ec4c8a',
                  image: item.image || 'images/moule_silicone.jpg',
                  description: item.description || '',
                  inStock: item.inStock !== false,
                  featured: Boolean(item.featured),
                  createdAt: item.createdAt || new Date().toISOString()
               }));
               this.setArticles(validated);
               return { success: true, count: validated.length };
            }
            return { success: false, error: 'Format JSON invalide : doit être un tableau d\'articles.' };
         } catch (e) {
            return { success: false, error: 'Erreur d\'analyse JSON : ' + e.message };
         }
      },

      /**
       * Retourne le libellé textuel correspondant à une catégorie
       */
      getCategoryLabel: function (cat) {
         switch (cat) {
            case 'silicone':
               return 'Moules Silicone';
            case 'cakedesign':
               return 'Pâte à Sucre & Cake Design';
            case 'chocolat':
               return 'Chocolaterie';
            case 'boulangerie':
               return 'Boulangerie & Cuisson';
            case 'combos':
               return 'Packs Éco & Promos';
            default:
               return 'Accessoires';
         }
      },

      /**
       * Génère le lien WhatsApp pré-rempli pour commander l'article
       */
      getWhatsAppLink: function (article) {
         const phone = '21624864006';
         const text = `Bonjour PROPATISS, je souhaite commander l'article : ${article.title} à ${article.price} DT`;
         return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
      },

      /**
       * Liste des images de démonstration disponibles
       */
      getPresetImages: function () {
         return [
            { label: 'Moule Silicone', url: 'images/moule_silicone.jpg' },
            { label: 'Pâte à Sucre & Outils', url: 'images/pate_sucre_outils.jpg' },
            { label: 'Chocolaterie & Moules Poly', url: 'images/chocolaterie_moules.jpg' },
            { label: 'Boulangerie & Silpat', url: 'images/boulangerie_materiel.jpg' },
            { label: 'Chocolat Décor', url: 'images/choclate_img.jpg' },
            { label: 'Tablette & Barres', url: 'images/bar.jpg' }
         ];
      }
   };

   // Initialisation automatique au chargement
   ProductStore.init();

   // Exposition globale
   window.ProductStore = ProductStore;

})(window);
