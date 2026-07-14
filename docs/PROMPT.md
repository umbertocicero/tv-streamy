# Prompt completo — specifica funzionale di TV Streamy

Costruisci **TV Streamy**, un clone web (responsive, mobile-first) di TV Time, un'app social per tracciare la visione di serie TV e film. Di seguito la specifica funzionale completa, dedotta analizzando ogni schermata dell'app originale.

### 1. Autenticazione (login.png)
- Schermata di login sovrapposta a un mosaico semi-trasparente di locandine come sfondo, con logo "TV TIME" in alto.
- Titolo "Continua con" e pulsanti di login social: Apple, Facebook, Google, X (Twitter), Email.
- Checkbox opt-in: "Voglio ricevere aggiornamenti via email sulle mie serie e sui miei film".
- Link a "condizioni d'uso" e "norme sulla privacy" nel testo di consenso.

### 2. Home / Lista "Da vedere" (list.png)
- Tab superiori: **Lista di cose da vedere** / **In arrivo**.
- Badge di stato per ogni serie (es. "Non iniziato").
- Card episodio con poster, badge nome serie (cliccabile), numero stagione/episodio (es. "S01 | E01 +21" per indicare episodi arretrati), titolo episodio, e pulsante di check (segna come visto) a destra.
- Pulsante "Sfoglia tutte le serie" per accedere al catalogo completo.
- Icona per cambiare la vista in griglia.

### 3. Liste personalizzate (cvreate list.png)
- Sezione "Liste" con pulsante "Crea una nuova lista".
- Ogni lista è rappresentata da una card con collage di locandine dei titoli contenuti, nome della lista, menu contestuale (•••) e indicatore di privacy/visibilità (icona cerchio).

### 4. Dettaglio contenuto — Info (detail.png, info.png, info2.png)
- Header con carosello di immagini/backdrop del titolo, pulsante chiudi e menu (•••).
- Titolo, generi (tag), data di uscita/visione programmata, stato visione ("Non visto"/"Visto"), pulsante check rapido per segnare come visto.
- Tab **Info** / **Altro**.
- Sezione "Dove guardare" con icona impostazioni (per configurare i servizi di streaming collegati) — stato "Non disponibile" se non associato a nessuna piattaforma.
- Sezione "Informazioni film/serie": logo TV Time, valutazione media a stelle (es. 4.6/5) e numero di voti, trama/sinossi.
- Blocco trailer cliccabile con thumbnail, titolo "Guarda il trailer" e durata.
- Contatore social "N hanno aggiunto questo film/questa serie".
- Sezione **Cast**: locandine circolari/quadrate degli attori con nome attore e nome personaggio.
- Sezione "Gli altri hanno visto anche": carosello orizzontale di titoli correlati, ciascuno con pulsante rapido aggiungi (+) o già aggiunto (spunta).
- Sondaggio "Cosa ti interessa di più di questo film?" con opzioni a pulsante: Il cast, La premessa, I creatori, Lo studio, Il franchise o l'universo, Altro.
- Sezione **Commenti** con contatore totale e link per aprire la vista commenti completa.
- Pulsante fisso in basso "+ Aggiungi film/serie" (aggiunge alla propria libreria).

### 5. Dettaglio — Tab "Altro" (altro.png)
- "Dove l'hai visto?": scelte rapide con icona — Theater (cinema), Altro, Servizio non ufficiale.
- "Valuta questo film": rating a 5 stelle con etichette Brutto / Ok / Bello / Super / Wow.
- "Che impressione hai avuto?": griglia di emoji/reazioni selezionabili (Scioccato, Frustrato, Triste, Riflessivo, Commosso, Divertito, Sorpreso, Annoiato, ecc.).
- Scorciatoia al blocco commenti (pulsante "930 commenti" con freccia).

### 6. Scopri / Filtri (filter.png)
- Sezione "Scopri di più" con tab **Serie** / **Film**.
- Griglia di locandine con pulsante rapido aggiungi (+) o spunta se già aggiunto in alto a destra su ciascuna.
- Modale filtri con:
  - "Sort by": pulsanti Trending / Most added.
  - "Genres": griglia di tile con immagine di sfondo e nome genere (Drama, Comedy, Action, Animation, Romance, Crime, Adventure, Fantasy, Anime, Suspense, Mystery, Science fiction, Thriller, Family, Musical, ...).
  - Sezione "Avanzati" con toggle "Include added movies".
  - Pulsanti "Reimposta" e "Applica".

### 7. Esplora / Feed (search.png)
- Barra di ricerca in alto ("Cerca").
- Tab: **Feed** / **Scopri** / **Gruppi** / **Attività**.
- Feed a card grandi: immagine/backdrop, icona tipo contenuto (film/serie), titolo, durata e generi, sinossi breve, pulsante aggiungi rapido (+) o spunta se già in libreria.
- Bottom navigation: Serie, Film, Esplora (attivo), Profilo.

### 8. Ricerca (search2.png)
- Campo di ricerca con placeholder "Cerca serie e film" e pulsante "Annulla".
- Tab risultati: **Serie e film** / **Utenti** / **Gruppi**.
- Lista risultati: locandina piccola, titolo, contatore sociale ("N hanno aggiunto questo film/questa serie"), pulsante rapido aggiungi (+).

### 9. Menu azioni rapide (azioni.png)
- Bottom sheet contestuale su un titolo con stato corrente ("Non visto") e opzioni:
  - Personalizza
  - Preferito
  - Aggiungi alla lista
  - Rimuovi il film
  - Condividi

### 10. Commenti (comments.png, comments2.png)
- Prima di mostrare commenti su un titolo non ancora visto: modale anti-spoiler "Spoiler a seguire! Non hai ancora visto questo film. Vuoi davvero leggere i commenti?" con azioni Mostra comunque / Ho visto questo film / Annulla.
- Vista commenti dedicata: header con titolo e contatore commenti, ordinamento ("Ordina per: I più rilevanti"), icona impostazioni commenti.
- Ogni commento: avatar utente, nome utente, data, testo (che può contenere emoji), immagine/GIF opzionale allegata, azioni like (cuore + contatore), rispondi (contatore risposte), condividi, pulsante segnala (flag).
- Pulsante flottante per scrivere un nuovo commento (icona matita).

### 11. Profilo utente (profile.png, profile2.png)
- Header con immagine di copertina personalizzabile, icona notifiche, menu (•••).
- Avatar, username, pulsante "Modifica".
- Contatori: Following, Follower, Commenti.
- Sezione **Statistiche** (riepilogo): Tempo serie (mesi/giorni/ore), Episodi visti, Tempo film (mesi/giorni/ore), Film visti — con link per il dettaglio.
- Sezione **Liste**: carosello delle liste create dall'utente.
- Sezione **Serie**: locandine delle serie in libreria.
- Sezione **Serie TV preferite**: locandine contrassegnate come preferite.
- Sezione **Film**: griglia orizzontale scrollabile di tutti i film aggiunti.
- Sezione **Film preferiti**: sottoinsieme dei preferiti.
- Bottom navigation: Serie, Film, Esplora, Profilo (attivo).

### 12. Statistiche dettagliate (statistiche.png, statistiche2.png)
- Header "Statistiche" con tab **Serie** / **Film**.
- Card "Tempo trascorso a guardare episodi": totale in mesi/giorni/ore + variazione ultimi 7 giorni, e grafico a barre giornaliero (ultimi 10 giorni) con etichette data.
- Card "Totale episodi visti": numero totale + variazione ultimi 7 giorni, con grafico a barre.
- Card "Quanto velocemente ti stai mettendo in pari?": episodi/settimana calcolato sugli ultimi due mesi.
- Card "Tempo da guardare": ore rimanenti stimate per completare gli episodi arretrati.
- Card "Tempo di visione futuro": grafico a barre mensile (proiezione dei prossimi mesi).
- Card "Quando ti metterai in pari con i tuoi episodi": data stimata.
- Card "Medaglie dell'app": conteggio badge/achievement guadagnati, con griglia di icone medaglia (es. Author, Socializer, Meme, Emo, ecc.) sbloccabili in base all'attività dell'utente.
- Le card sono paginabili (indicatori a pallini) e navigabili in swipe.

### 13. Impostazioni account (profile_settings.png)
- Header "Impostazioni" con tab **Account** / **App** / **In arrivo**.
- Sezione "Identificazione": Nome utente, Email, ID utente (sola lettura), link "Cambia password", pulsante "Salva".
- Sezione "Social network": link "Modifica gli account collegati".
- Sezione "Servizi di abbonamento": link "Modifica i tuoi servizi di abbonamento" (piattaforme streaming possedute, usate per popolare "Dove guardare").
- Sezione "Privacy": link "Leggi Privacy e Note legali", toggle "Imposta il profilo come privato" (con descrizione: se privato, richieste di follow da approvare e attività visibile solo ai follower).
- Pulsante "Esci" (logout) evidenziato.
- Link "Elimina l'account".

### 14. Impostazioni lingua commenti (language.png)
- Header "Lingua dei commenti" con sottotitolo "Mostra i commenti nelle lingue seguenti:".
- Lista scrollabile a checkbox di tutte le lingue disponibili (ordine alfabetico, elenco molto lungo: Afrikaans, Akan, Albanese, Amarico, Arabo, Armeno, Assamese, Azerbaigiano, Bambara, Basco, Bengalese, Bielorusso, Birmano, Bosniaco, Bretone, Bulgaro, Catalano, Ceco, ...).

---

### Stack e requisiti tecnici suggeriti
- Frontend responsive (mobile-first) in stile dark theme (nero/grigio scuro) con accento giallo/oro come colore primario (CTA, badge, elementi attivi).
- Bottom navigation fissa su mobile con 4 sezioni: Serie, Film, Esplora, Profilo.
- Gestione stato utente: libreria personale (serie/film aggiunti), stato visione per episodio, liste custom, preferiti, following/follower.
- Integrazione con un catalogo esterno (tipo TMDB) per poster, sinossi, cast, trailer, generi, valutazioni.
- Sistema di commenti con moderazione (flag), anti-spoiler gate, reazioni like, filtro per lingua.
- Modulo statistiche calcolato sui dati di visione dell'utente (tempo totale, episodi visti, ritmo settimanale, proiezioni future, data di "essere in pari").
- Sistema achievement/medaglie basato su eventi utente (commenti, condivisioni, ecc.).
- Impostazioni account con gestione profilo pubblico/privato, servizi di streaming collegati, social collegati, cambio password, eliminazione account.

Obiettivo: replicare fedelmente flussi, gerarchia informativa e componenti UI descritti sopra, così da ottenere un clone preciso e affidabile di TV Time.
