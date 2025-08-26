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
    const [pedigreeData, setPedigreeData] = useState( [])


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
            loadNodeChildren(fish.id, 0, []);
            setupLazyLoading();
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


    useEffect( () => {
        let max = 0;
        function traverse(node) {
            if (node.value > max) max = node.value;
            if (node.children) {
                node.children.forEach(traverse);
            }
        }
        pedigreeData.forEach(traverse);
    }, [pedigreeData])


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
                        data: pedigreeData,
                        top: '1%',
                        left: '7%',
                        bottom: '1%',
                        right: '20%',
                        symbolSize: 7,
                        label: {
                            position: 'left',
                            verticalAlign: 'bottom',
                            align: 'right',
                            fontSize: 10,
                            fontWeight: '600',
                            color: '#1d8cf8',
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
                    }
                ]
            }

            chartInstance.current.setOption(option);
        }

    }, [pedigreeData, isLoading]);

    function loadNodeChildren(fishId, fishGeneration, treeData) {
        getData("manage_fish/pedigree", getUsernameRef.current(),
            {'start_id': fishId, 'start_generation': fishGeneration}, (success) => {
            if ('data' in success) {
                const newPedigreeData = updateTreeNode(treeData, fishId, success['data']);
                setPedigreeData(newPedigreeData);
            }
                setIsLoading(false);
            }, setAlertLevel, setAlertText, () =>{
                setIsLoading(false);
            });
    }

    function updateTreeNode(data, targetId, openedTree) {
        if (data.length === 0){
            return [openedTree];
        }
        return data.map(node => {
            if (node.id === targetId) {
                return {
                    ...node,
                    children: openedTree['children'],
                    loaded: true,
                    collapsed: false,
                };
            } else if (node.children && node.children.length > 0) {
                return {
                    ...node,
                    children: updateTreeNode(node.children, targetId, openedTree)
                };
            }
            return node;
        });
    }

    const setupLazyLoading = () => {
        chartInstance.current.on('click', async function (params) {
            if (params.data.has_children && !params.data.loaded) {
                await loadNodeChildren(params.data.id, params.data.value, chartInstance.current.getOption().series[0]['data']);
            }
        });
    };

    return <div ref={chartRef} style={{ width: 'inherit', height: '400px'}}/>;
}

