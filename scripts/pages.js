const homePage = `
    <div class="content" style="background-color: #cd113b; align-items: center;" id="home">
    <img src="./res/me.jpeg" height="200px" style="border-radius: 50%; margin-bottom: 30px"></img>
    <h1 class="text-center">Hi!</h1>
    <h3 class="text-center">My name is Swarnim Doegar</h3>
    <h4 style="margin-top: 30px;" class="text-center">I am a Web Developer.</h4>
    </div>
`;

const projectsHTML = projectList
  .map((project) => {
    return `
    <span class="project">
    <h4>${project.name}</h4>
    <p>${project.description}</p>
    <a href="${project.githubLink}">Visit Repo &#10022;</a>
    </span>`;
  })
  .reduce((acc, str) => acc + str, "");

const projectsPage = `
    <div class="content" style="background-color: #FF7600; align-items: center;" id="projects">
    <h2 class="heading">projects</h2>
    ${projectsHTML}
    </div>
`;

const skillsPage = ``;

const connectPage = `
    <div class="content" style="background-color: #FFD371; align-items: center" id="connect">
    <h2 class="heading">connect</h2>
    <div class="sites">
    <a href="https://github.com/SwarnimDoegar"><img src="./res/github.png" alt="github"></a>
    <a href="https://www.linkedin.com/in/swarnim-doegar/"><img src="./res/linkedin.png" alt="linkedin"></a>
    <a href="mailto:swarnimdoegar@gmail.com"><img src="./res/email.png" alt="email"></a>
    </div>
    </div>
`;

const pages = [homePage, projectsPage, skillsPage, connectPage];
