import { useEffect } from "react";
import { useApp } from "./state/AppStateContext.jsx";
import { NavProvider, useNav } from "./state/NavContext.jsx";

import Login from "./pages/Login.jsx";
import Series from "./pages/Series.jsx";
import Movies from "./pages/Movies.jsx";
import Explore from "./pages/Explore.jsx";
import Browse from "./pages/Browse.jsx";
import Search from "./pages/Search.jsx";
import Detail from "./pages/Detail.jsx";
import Comments from "./pages/Comments.jsx";
import Lists from "./pages/Lists.jsx";
import Profile from "./pages/Profile.jsx";
import Stats from "./pages/Stats.jsx";
import Settings from "./pages/Settings.jsx";
import Language from "./pages/Language.jsx";

// Mappa view -> pagina: unico punto in cui si registrano le schermate dell'app.
const PAGES = {
  login: Login,
  serie: Series,
  film: Movies,
  esplora: Explore,
  browse: Browse,
  search: Search,
  detail: Detail,
  comments: Comments,
  liste: Lists,
  profilo: Profile,
  statistiche: Stats,
  impostazioni: Settings,
  lingua: Language,
};

function Screen() {
  const { route } = useNav();

  // Torna in cima ad ogni cambio schermata, come una navigazione nativa.
  useEffect(() => window.scrollTo(0, 0), [route]);

  const Page = PAGES[route.view] || Series;
  return (
    <div id="app">
      <Page />
    </div>
  );
}

export default function App() {
  const { S } = useApp();
  return (
    <NavProvider initial={{ view: S.loggedIn ? "serie" : "login" }}>
      <Screen />
    </NavProvider>
  );
}
