import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import MaskedInput from "react-text-mask";
import { Link, useHistory } from "react-router-dom";
import { FiArrowLeft, FiCheckCircle, FiX, FiXCircle } from "react-icons/fi";
import { Map, TileLayer, Marker } from "react-leaflet";
import { LeafletMouseEvent } from "leaflet";

import Dropzone from "../../components/Dropzone";

import api from "../../services/api";
import ibge from "../../services/ibge";

import "./styles.css";
import logo from "../../assets/logo.svg";

interface IBGEUFResponse {
  sigla: string;
  nome: string;
}

interface IBGECityResponse {
  nome: string;
}

interface Item {
  id: number;
  title: string;
  image_url: string;
}

interface CreatePointResponse {
  error: boolean;
  message: string;
  point: {
    id: number;
    image: string;
    name: string;
    email: string;
    whatsapp: string;
    latitude: number;
    longitude: number;
    city: string;
    uf: string;
  };
}

const CreatePoint = () => {
  const [selectedFile, setSelectedFile] = useState<File>();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    whatsapp: "",
  });

  const [ufs, setUfs] = useState<IBGEUFResponse[]>([]);
  const [cities, setCities] = useState<IBGECityResponse[]>([]);

  const [selectedUf, setSelectedUf] = useState<string>("0");
  const [selectedCity, setSelectedCity] = useState<string>("0");

  const [initialPosition, setInitialPosition] = useState<[number, number]>([
    -15.721387,
    -48.0774466,
  ]);
  const [zoom, setZoom] = useState(3);

  const [selectedPosition, setSelectedPosition] = useState<[number, number]>([
    -15.721387,
    -48.0774466,
  ]);

  const [items, setItems] = useState<Item[]>([]);

  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  const [msg, setMsg] = useState({
    visible: false,
    type: "",
    text: "",
  });

  const [redirect, setRedirect] = useState({
    visible: false,
    enabled: false,
    count: 0,
  });

  const history = useHistory();

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;

      setZoom(15);
      setInitialPosition([latitude, longitude]);
      setSelectedPosition([latitude, longitude]);
    });
  }, []);

  useEffect(() => {
    async function loadUfs() {
      const response = await ibge.get<IBGEUFResponse[]>(
        "localidades/estados?orderBy=nome"
      );

      const ufInitials = response.data.map((uf) => {
        return {
          sigla: uf.sigla,
          nome: uf.nome,
        };
      });

      setUfs(ufInitials);
    }

    loadUfs();
  }, []);

  useEffect(() => {
    async function loadCities() {
      if (selectedUf === "0") {
        setCities([]);
      }

      const response = await ibge.get<IBGECityResponse[]>(
        `localidades/estados/${selectedUf}/municipios`
      );

      const cityNames = response.data.map((city) => {
        return { nome: city.nome };
      });

      setCities(cityNames);
    }

    loadCities();
  }, [selectedUf]);

  useEffect(() => {
    async function loadItems() {
      const response = await api.get("/items");

      setItems(response.data);
    }

    loadItems();
  }, []);

  useEffect(() => {
    if (redirect.enabled) {
      let interval = setInterval(() => {
        setRedirect({ ...redirect, count: redirect.count - 1 });
      }, 1000);

      if (redirect.count === 0) {
        clearInterval(interval);
        setMsg({ visible: false, type: "", text: "" });
        setRedirect({ visible: false, enabled: false, count: 0 });
        history.push("/");
      }
      return () => clearInterval(interval);
    }
  }, [redirect, history]);

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;

    setFormData({ ...formData, [name]: value });
  }

  function handleSelectUf(event: ChangeEvent<HTMLSelectElement>) {
    const uf = event.target.value;

    setSelectedUf(uf);
  }

  function handleSelectCity(event: ChangeEvent<HTMLSelectElement>) {
    const city = event.target.value;

    setSelectedCity(city);
  }

  function handleMapClick(event: LeafletMouseEvent) {
    setSelectedPosition([event.latlng.lat, event.latlng.lng]);
  }

  function handleSelectItem(id: number) {
    const alreadySelected = selectedItems.findIndex((item) => item === id);

    if (alreadySelected >= 0) {
      const filteredItems = selectedItems.filter((item) => item !== id);

      setSelectedItems(filteredItems);
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  }

  function showMsg(type: string, text: string) {
    setMsg({ visible: true, type, text });
  }

  function handleCloseMsg() {
    setMsg({ visible: false, type: "", text: "" });
  }

  function handleCloseMsgAndReturn() {
    setMsg({ visible: false, type: "", text: "" });
    setRedirect({ visible: false, enabled: false, count: 0 });
    history.push("/");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const { name, email, whatsapp } = formData;
    const whatsappWithCode = "+055 " + whatsapp;
    const uf = selectedUf;
    const city = selectedCity;
    const [latitude, longitude] = selectedPosition;
    const items = selectedItems;

    const data = new FormData();

    data.append("name", name);
    data.append("email", email);
    data.append("whatsapp", whatsappWithCode);
    data.append("uf", uf);
    data.append("city", city);
    data.append("latitude", String(latitude));
    data.append("longitude", String(longitude));
    data.append("items", items.join(","));

    if (selectedFile) {
      data.append("image", selectedFile);
    }

    const response = await api.post("points", data);

    if (response.status === 200) {
      if (response.data.error === false) {
        const responseData = response.data as CreatePointResponse;

        showMsg("success", responseData.message);
        setRedirect({ visible: true, enabled: true, count: 5 });
      } else {
        showMsg("error", response.data.message);
      }
    } else {
      showMsg("error", "Oops... algo deu errado!");
    }
  }

  return (
    <div id="page-create-point">
      <div
        className="message-container"
        style={
          msg.visible
            ? ({ display: "flex" } as React.CSSProperties)
            : ({ display: "none" } as React.CSSProperties)
        }
      >
        <button
          className="message-button"
          onClick={!redirect.enabled ? handleCloseMsg : handleCloseMsgAndReturn}
        >
          <FiX size="40px" />
        </button>

        {msg.type === "success" && (
          <FiCheckCircle size="40px" className="message-icon-success" />
        )}

        {msg.type === "error" && (
          <FiXCircle size="40px" className="message-icon-error" />
        )}

        <p className="message-text">{msg.text}</p>

        {redirect.visible && (
          <p className="message-redirect">
            Redirecionando em ({redirect.count}) segundos...
          </p>
        )}
      </div>

      <div className="content">
        <header>
          <img src={logo} alt="Ecoleta" />

          <Link to="/">
            <FiArrowLeft />
            Voltar para home
          </Link>
        </header>

        <form onSubmit={handleSubmit}>
          <h1>
            Cadastro do <br /> ponto de coleta
          </h1>

          <Dropzone onFileUploaded={setSelectedFile} />

          <fieldset>
            <legend>
              <h2>Dados</h2>
            </legend>

            <div className="field">
              <label htmlFor="name">Nome da Entidade</label>
              <input
                type="text"
                name="name"
                id="name"
                placeholder="Ex.: Baratão Shopping"
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="field-group">
              <div className="field">
                <label htmlFor="email">E-mail</label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  placeholder="exemplo@dominio.com"
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="whatsapp">Whatsapp</label>
                <MaskedInput
                  mask={[
                    "(",
                    /[1-9]/,
                    /\d/,
                    ")",
                    " ",
                    /\d/,
                    /\d/,
                    /\d/,
                    /\d/,
                    /\d/,
                    "-",
                    /\d/,
                    /\d/,
                    /\d/,
                    /\d/,
                  ]}
                  type="text"
                  name="whatsapp"
                  id="whatsapp"
                  placeholder="(   ) _____-____"
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend>
              <h2>Endereço</h2>
              <span>Selecione o endereço no mapa</span>
            </legend>

            <Map center={initialPosition} zoom={zoom} onClick={handleMapClick}>
              <TileLayer
                attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <Marker position={selectedPosition} />
            </Map>

            <div className="field-group">
              <div className="field">
                <label htmlFor="uf">Estado (UF)</label>
                <select
                  name="uf"
                  id="uf"
                  value={selectedUf}
                  onChange={handleSelectUf}
                >
                  <option value="0">Selecione uma UF</option>
                  {ufs.map((uf) => (
                    <option key={uf.sigla} value={uf.sigla}>
                      {uf.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="city">Cidade</label>
                <select
                  name="city"
                  id="city"
                  value={selectedCity}
                  onChange={handleSelectCity}
                >
                  <option value="0">Selecione uma cidade</option>
                  {cities.map((city) => (
                    <option key={city.nome} value={city.nome}>
                      {city.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend>
              <h2>Ítens de coleta</h2>
              <span>Selecione um ou mais ítens abaixo</span>
            </legend>

            <ul className="items-grid">
              {items.map((item) => (
                <li
                  key={item.id}
                  onClick={() => handleSelectItem(item.id)}
                  className={selectedItems.includes(item.id) ? "selected" : ""}
                >
                  <img src={item.image_url} alt={item.title} />
                  <span>{item.title}</span>
                </li>
              ))}
            </ul>
          </fieldset>

          <button type="submit">Cadastrar ponto de coleta</button>
        </form>
      </div>
    </div>
  );
};

export default CreatePoint;
