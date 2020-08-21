import React, { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import { LayersModel } from '@tensorflow/tfjs';

import {Bar} from 'react-chartjs-2';

type Coordinates = {
  x: number;
  y: number;
};

function Canvas() {

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
    const [model, setModel] = useState<LayersModel | null>(null);
    const [output, setOutput] = useState<Array<number> | null>(null);

    useEffect(() => {
        async function loadModel() {
            const model = await tf.loadLayersModel('http://localhost:3333/api/model.json');
            setModel(model);
        }
        loadModel();
    });

    useEffect(() => {
        let mouseDown: boolean = false;
        let start: Coordinates = { x: 0, y: 0 };
        let end: Coordinates = { x: 0, y: 0 };
        let canvasOffsetLeft: number = 0;
        let canvasOffsetTop: number = 0;

        function handleMouseDown(evt: MouseEvent) {
            mouseDown = true;
            start = {
                x: evt.clientX - canvasOffsetLeft,
                y: evt.clientY - canvasOffsetTop
            };
            end = {
                x: evt.clientX - canvasOffsetLeft,
                y: evt.clientY - canvasOffsetTop
            };
        }

        function handleMouseUp(evt: MouseEvent) {
            mouseDown = false;
        }

        function handleMouseMove(evt: MouseEvent) {
            if (mouseDown && context) {
                start = {
                    x: end.x,
                    y: end.y,
                };

                end = {
                    x: evt.clientX - canvasOffsetLeft,
                    y: evt.clientY - canvasOffsetTop,
                };

                context.beginPath();
                context.moveTo(start.x, start.y);
                context.lineTo(end.x, end.y);
                context.strokeStyle = `#6032a8`;
                context.lineWidth = 8;
                context.stroke();
                context.closePath();
            }
        }


        if (canvasRef.current) {
            const renderCtx = canvasRef.current.getContext('2d');
            if (renderCtx) {
                canvasRef.current.addEventListener('mousedown', handleMouseDown);
                canvasRef.current.addEventListener('mouseup', handleMouseUp);
                canvasRef.current.addEventListener('mousemove', handleMouseMove);

                canvasOffsetLeft = canvasRef.current.offsetLeft;
                canvasOffsetTop = canvasRef.current.offsetTop;

                setContext(renderCtx);
            }
        }

        return function cleanup() {
            if (canvasRef.current) {
                canvasRef.current.removeEventListener('mousedown', handleMouseDown);
                canvasRef.current.removeEventListener('mouseup', handleMouseUp);
                canvasRef.current.removeEventListener('mousemove', handleMouseMove);
            }
        }
    }, [context]);

    const handlePredict = () => {
        if (context) {
            const img = canvasRef.current as HTMLCanvasElement;
            context.drawImage(img, 0, 0, 28, 28);
            var data = context.getImageData(0, 0, 28, 28);
            tf.tidy(() => {
                var img = tf.browser.fromPixels(data, 1);
                var reshape = img.reshape([1, 28, 28, 1]);
                var imgCast = tf.cast(reshape, 'float32');
                if (model) {
                    const prediction = model.predict(imgCast) as tf.Tensor;
                    const output = Array.from(prediction.dataSync());
                    console.log(output);
                    setOutput(output);
                }
            });
        }
    };

    const handleClean = () => {
        if (canvasRef.current) {
            const renderCtx = canvasRef.current.getContext('2d');
            if (renderCtx) {
                renderCtx.clearRect(0, 0, 300, 300);
                setContext(renderCtx);
            }
            setOutput([]);
        }
    }

    const data = {
        labels: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
        datasets: [
          {
            label: '%',
            backgroundColor: 'rgba(255,99,132,0.2)',
            borderColor: 'rgba(255,99,132,1)',
            borderWidth: 1,
            hoverBackgroundColor: 'rgba(255,99,132,0.4)',
            hoverBorderColor: 'rgba(255,99,132,1)',
            data: output
          }
        ]
    };

    return (
        <>
            <div className="draw">
                <canvas id="canvas" ref={canvasRef}
                    width={300} height={300}
                    style={{ border: '2px solid #000', marginTop: 20 }}/>
                <button onClick={() => handlePredict()}>
                    Detectar
                </button>
                <button onClick={() => handleClean()}>
                    Limpar
                </button>
            </div>
            <div className="chart">
                {
                    output !== null && output.length > 0 ? <Bar
                    data={data}
                    width={100}
                    height={400}
                    options={{
                        maintainAspectRatio: false
                    }} /> : 
                    <h2>Desenhe o dígito e clique em detectar para mostrar o gráfico do resultado.</h2>
                }
            </div>
        </>
    );
}

export default Canvas;
