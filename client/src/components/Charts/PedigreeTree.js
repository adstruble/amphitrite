import * as echarts from 'echarts';
import React, {useEffect, useRef, useState} from "react";
import getData from "../../server/getData.js";
import useToken from "../App/useToken.js";
import {formatDate} from "../Utils/FormatFunctions.jsx";



export default function PedigreeTree({fish, setAlertLevel, setAlertText}) {
    const {getUsername} = useToken();
    const getUsernameRef = useRef(getUsername);
    getUsernameRef.current = getUsername;

    const chartRef = useRef(null);
    /** @type {React.MutableRefObject<echarts.ECharts | null>} */
    const chartInstance = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [pedigreeData, setPedigreeData] = useState([])

   /* $.get(ROOT_PATH + '/data/asset/data/flare.json', function (data) {
        myChart.hideLoading();
        data.children.forEach(function (datum, index) {
            index % 2 === 0 && (datum.collapsed = true);
        });
    });*/

    useEffect(() => {
        if (chartInstance.current) {
            if (isLoading) {
                chartInstance.current.showLoading();
            } else {
                chartInstance.current.hideLoading();
            }
        }
    }, [isLoading]);

    useEffect(() => {
        if (chartRef.current && !chartInstance.current) {
            chartInstance.current = echarts.init(chartRef.current);
        }
        return () => {
            if (chartInstance.current) {
                chartInstance.current.dispose();
                chartInstance.current = null;
            }
        };
    }, []);

    const formatTreeTooltips = (params) =>{
        const data = params.data;
        return `
        <div style="
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 8px;
          padding: 15px;
          color: white;
          font-family: Arial, sans-serif;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          min-width: 250px;
        ">
          <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">
            ${data.name} Details: 
          </div>
          <div style="margin-bottom: 8px;">
            <strong>Tag:</strong> ${data.tag}
          </div>
          <div style="margin-bottom: 8px;">
            <strong>Parent's Cross Date:</strong> ${formatDate(data.cross_date) || 'Not recorded'}
          </div>
          <div style="margin-bottom: 8px;">
            <strong>Self Cross Date:</strong> ${(data.child_cross_date && formatDate(data.child_cross_date)) || 'Not Crossed'}
          </div>
          <div style="margin-bottom: 8px;">
            <strong>Sex:</strong> ${data.sex || 'Unknown'}
          </div>
          <div style="margin-bottom: 8px;">
            <strong>Box:</strong> ${data.box || 'Unknown'}
          </div>
          <hr style="border: 1px solid rgba(255,255,255,0.3); margin: 10px 0;">
          <!--div style="font-size: 12px; opacity: 0.8;">
            Click for more details
          </div-->
        </div>
      `;
    }


    useEffect(() => {
        if (chartInstance.current && pedigreeData && !isLoading) {

            // Set chart options
            const option = {
                tooltip: {
                    trigger: 'item',
                        triggerOn: 'mousemove'
                },
                formatter: formatTreeTooltips,

                series: [
                    {
                        type: 'tree',
                        data: [pedigreeData],
                        top: '1%',
                        left: '7%',
                        bottom: '1%',
                        right: '20%',
                        symbolSize: 7,
                        label: {
                            position: 'left',
                            verticalAlign: 'middle',
                            align: 'right',
                            fontSize: 9,
                            color: 'white',
                            textBorderWidth: 0,
                            textShadowBlur: 0
                        },
                        leaves: {
                            label: {
                                position: 'right',
                                verticalAlign: 'middle',
                                align: 'left'
                            }
                        },
                        emphasis: {
                            focus: 'descendant'
                        },
                        expandAndCollapse: true,
                        animationDuration: 550,
                        animationDurationUpdate: 750,
                        animation: true,
                        animationThreshold: 10000,
                        initialTreeDepth: 5
                    }
                ]
            }

            chartInstance.current.setOption(option);
        }

    }, [pedigreeData, isLoading]);

    // Fetch data
    useEffect(() => {
        setIsLoading(true);
        getData("manage_fish/pedigree", getUsernameRef.current(),
            {'start_id': fish.id}, (success) => {
            if ('data' in success) {
                setPedigreeData(success['data'])
            }
                setIsLoading(false);
            }, setAlertLevel, setAlertText, () =>{
                setIsLoading(false);
            });
    }, []);

    return <div ref={chartRef} style={{ width: 'inherit', height: '400px'}}/>;
}

