import ShareFilesButton from "./ShareFiles.jsx";
import { buildStandingsFiles } from "../lib/standingsImage.js";
import { shareStandings } from "../lib/format.js";

// Compartilhar a classificação como imagem, PDF ou texto.
export default function ShareStandingsButton({ data, className, children }) {
  return (
    <ShareFilesButton
      className={className}
      modalTitle="Compartilhar classificação"
      shareTitle="Classificação · Campeonato Brejolandense"
      filenameBase="classificacao-brejolandense"
      loadingLabel="Gerando a imagem da tabela..."
      getFiles={() => buildStandingsFiles(data)}
      onText={() => shareStandings(data)}
    >
      {children}
    </ShareFilesButton>
  );
}
