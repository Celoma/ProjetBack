# ProjetBack

Dans un monde professionnel en constante mutation, où le télétravail côtoie les réunions hybrides et les décisions se prennent parfois à la minute près, les entreprises doivent s’adapter rapidement. Ce projet a été développé pour répondre aux besoins de **WorkEase**, une entreprise dynamique spécialisée dans l’optimisation des environnements de travail.

Jusqu’à maintenant, la gestion des salles de réunion chez WorkEase se faisait de manière artisanale : un tableur partagé, quelques échanges de mails, et beaucoup de confusion. Résultat : des conflits de réservation, des salles vides alors qu’elles sont bloquées, et une perte de temps considérable.

Ce projet vise à résoudre ces problèmes en proposant une **API REST fiable, sécurisée, évolutive et intelligente** pour gérer les réservations de salles. Elle intègre :
- Des contraintes personnalisées pour chaque salle.
- Une gestion fine des profils utilisateurs.
- Une vérification rigoureuse des conflits de planning.

## Prérequis

Avant de commencer, assurez-vous d'avoir les outils suivants installés sur votre machine :
- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)

## Lancer le projet localement

Suivez les étapes ci-dessous pour configurer et lancer le projet localement :

### 1. Cloner le dépôt
Clonez ce dépôt sur votre machine locale :
```bash
git clone https://github.com/Celoma/ProjetBack.git
cd ProjetBack
```

### 2. Installer les dépendances
Installez les dépendances nécessaires avec npm
```bash
npm i
```

### 3. Configurer les variables d'environnement
Créez un fichier .env à la racine du projet et ajoutez-y les variables d'environnement nécessaires.

### 4. Lancer les services Docker
Le projet utilise une base de données via Docker, démarrez-les avec Docker Compose :
```bash
docker-compose up --build
```

### 5. Accéder à l'application
- L'application sera accessible sur http://localhost:3000.
- La base de données sera disponible sur le port spécifié dans le fichier docker-compose.yaml (par défaut: 5555)