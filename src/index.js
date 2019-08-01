import React from "react";
import ReactDOM from "react-dom";
import { Typography, Button, PageHeader, Card, List } from "antd";
import { TesseractWorker } from "tesseract.js";
import getTableFromOCR from "./getTableFromOCR";

import "antd/dist/antd.css";
import "./styles.css";

const { useState, useRef } = React;

const { Title, Paragraph, Text } = Typography;

const worker = new TesseractWorker();

function App() {
  const [routeData, setRouteData] = useState({ route: "upload" });
  return (
    <div className="App">
      {routeData.route === "upload" ? (
        <UploadWall setRouteData={setRouteData} />
      ) : (
        <Results setRouteData={setRouteData} results={routeData.results} />
      )}
    </div>
  );
}

function Results({ setRouteData, results }) {
  const renderItem = ([name, items]) => {
    const description = items
      .map(
        ({ itemName, confidence }) =>
          `${itemName} (${Math.round(confidence * 100)}%)`
      )
      .join(", ");
    return (
      <List.Item>
        <List.Item.Meta title={name} description={description} />
      </List.Item>
    );
  };
  return (
    <div>
      <Card>
        <PageHeader
          title="Lost Items"
          onBack={() => setRouteData({ route: "upload" })}
          className="header"
        />
      </Card>
      <div style={styles.container}>
        <List
          style={{ flexGrow: 1, margin: 12 }}
          dataSource={Array.from(results.entries())}
          itemLayout="horizontal"
          renderItem={renderItem}
        />
      </div>
    </div>
  );
}

function UploadWall({ setRouteData }) {
  const [items, setItems] = useState([]);

  const [isProcessing, setIsProcessing] = useState(false);

  const onProcess = async () => {
    const promises = items.map(item => worker.recognize(item.src, "eng", {}));
    setIsProcessing(true);
    const result = await Promise.all(promises);
    const results = getTableFromOCR(result);
    setIsProcessing(false);
    setRouteData({ route: "results", results });
  };

  const processButton = isProcessing ? (
    <Button key="process" icon="loading" type="primary" shape="circle" />
  ) : (
    <Button
      disabled={items.length === 0}
      key="process"
      type="primary"
      onClick={onProcess}
    >
      Process
    </Button>
  );

  return (
    <div>
      <Card>
        <PageHeader
          title="Lost Items"
          extra={[processButton]}
          className="header"
        />
      </Card>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}
      >
        <div style={styles.container}>
          {items.map(item => (
            <RemoveableImage
              key={item.src}
              style={styles.img}
              src={item.src}
              onRemove={() => {
                setItems(items.filter(i => i !== item));
                URL.revokeObjectURL(item.src);
              }}
            />
          ))}
          <ImageAddButton
            onChange={e => {
              const file = e.target.files[0];
              if (!file) {
                return;
              }
              const url = URL.createObjectURL(file);
              setItems([...items, { src: url, file }]);
            }}
          />
        </div>
        <About />
      </div>
    </div>
  );
}

function RemoveableImage({ onRemove, src }) {
  return (
    <div style={{ position: "relative" }}>
      <Button
        type="danger"
        shape="circle"
        icon="close"
        onClick={onRemove}
        style={styles.closeButton}
      />
      <img src={src} alt={src} style={styles.img} />
    </div>
  );
}

function ImageAddButton({ onChange }) {
  const inputRef = useRef(null);
  const onClick = () => {
    if (!inputRef.current) {
      return;
    }
    const el = inputRef.current;
    el.click();
  };
  return (
    <>
      <div style={styles.imageContainer}>
        <input
          onChange={onChange}
          ref={inputRef}
          style={styles.input}
          type="file"
        />
        <Button
          className="add-img-btn"
          onClick={onClick}
          icon="plus"
          shape="circle"
          size="large"
          type="primary"
        />
      </div>
    </>
  );
}

function About() {
  return (
    <Card style={styles.about}>
      <Title level={3}>How to Use This Tool</Title>
      <Title level={4}>WTF does this even do?</Title>
      <Paragraph>
        <Text strong>TL;DR:</Text> you take a picture of your Switch with all of
        your lost items up and this will create a table and tell you who you
        have to go to and what items you have to give them. Currently the app
        doesn't support iOS Safari.
      </Paragraph>
      <Paragraph>
        If you are like me you propably love Fire Emblem Three Houses. The one
        thing that I bet you hate is trying to find out who needs what lost
        items in an effort to boost your support rating. I wasted{" "}
        <Text strong>minutes</Text> of my life walking from person to person
        clicking every single lost item until they were gone. It was at that
        point that I would rather waste a few hours of my life building this
        instead.
      </Paragraph>
      <Title level={4}>The Steps</Title>
      <Paragraph>
        <ol>
          <li>Boot up Fire Emblem</li>
          <li>Talk to someone who is forgetful and can lose items</li>
          <li>
            Take a picture of this screen it is best to get a close up with
            nothing but the lost items in view, this is a perfect example:{" "}
            <img
              src="/myitems.jpg"
              alt="lost items screen shot example"
              style={{ width: 200, display: "block", margin: "12px 0" }}
            />
          </li>
          <li>
            Add the images one by one by pressing the + button above you,
            scrolling as nessessary, the tool will make sure to dedupe multiples
          </li>
          <li>
            Press the "Process" button, after a few seconds you will get a table
            of what lost item in the list belongs to who!
          </li>
        </ol>
      </Paragraph>
      <Title level={4}>About Me</Title>
      <Paragraph>
        Quickly thrown together by{" "}
        <a href="https://twitter.com/sawyerhood">Sawyer Hood</a>
      </Paragraph>
    </Card>
  );
}

const styles = {
  img: {
    display: "block",
    width: 96,
    height: 96,
    objectFit: "cover",
    margin: 12,
    borderRadius: 12
  },
  container: {
    display: "flex",
    width: "100%",
    flexWrap: "wrap",
    padding: 12,
    justifyContent: "center"
  },
  input: { display: "none" },
  imageContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 96,
    height: 96,
    margin: 12
  },
  closeButton: {
    position: "absolute",
    top: 18,
    right: 18
  },
  about: {
    margin: 24,
    maxWidth: 700,
    width: "100%"
  }
};

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
