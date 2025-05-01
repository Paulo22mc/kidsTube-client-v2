# 🎥 KidsTube - Client v2

**KidsTube** es una aplicación web diseñada para la gestión y organización de videos, proporcionando una experiencia **segura y controlada** para los usuarios. Este repositorio contiene el código del **frontend** de la aplicación, el cual se comunica con **kidsTube-server-v2 y kidsTube-graphql** que permite administrar la creación de usuarios, listas de reproducción(playlist) y videos.

---

## 📌 Descripción

La plataforma KidsTube permite a los usuarios interactuar con una **interfaz intuitiva y funcional**, enfocada en la gestión de contenido multimedia. A través de esta aplicación web, se consumen los servicios de una API que gestiona diversas funcionalidades, tales como:

### 👨‍👩‍👧 Registro y autenticación de usuarios
- Creación de cuentas tanto para **padres** como para **niños**.
- Validación de edad para asegurar que **solo adultos** puedan crear cuentas de padres.

### 🔐 Gestión de usuarios restringidos
- Los **niños** tienen acceso limitado a funcionalidades.
- Asegura un entorno **seguro y controlado**.

### 📁 Listas de reproducción
- Organización de videos en **playlists personalizadas**.
- Las listas son creadas y gestionadas por el **padre encargado**.

### 📹 Gestión de contenido multimedia
- **Crear, visualizar, editar y eliminar** videos fácilmente.

---

## 🛠️ Tecnologías utilizadas

- **Fetch API**: Comunicación con el backend mediante solicitudes HTTP.
- **MongoDB + Mongoose**: Base de datos no relacional para el manejo de usuarios, listas y videos.
- **Bootstrap**: Framework CSS para estilos y diseño responsivo.
- **JavaScript**: Lógica de programación del frontend.
- **HTML**: Estructura principal de la aplicación web.

---

## 🚀 Instalación y uso

Clona este repositorio:
   ```bash
   git clone https://github.com/tu-usuario/kidsTube-client-v2.git
   cd kidstube-cliente
   
## Inicialicelo 
 php -S localhost:8081
